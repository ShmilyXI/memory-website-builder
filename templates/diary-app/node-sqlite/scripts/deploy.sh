#!/bin/bash
# 部署到服务器：构建前端 → 上传后端代码 / 故事素材 / 前端 → 重启后端 → 检查。
#
#   bash scripts/deploy.sh
#
# 换服务器或密钥：  HOST=root@1.2.3.4 SSH_KEY=~/.ssh/xx bash scripts/deploy.sh
# 已经有构建好的前端：WEB_DIST=/path/to/dist bash scripts/deploy.sh
#
# 不碰的东西：服务器上的 server/.env（口令哈希、COS 密钥）、data/（日记数据库和原图）、Nginx 配置。
# 第一次上线要做的一次性配置见 docs/部署说明.md。服务器上没有 rsync，所以用「打包 → 传 → 解压」。
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${HOST:-myserver}
DOMAIN=${DOMAIN:-xlovey.cn}
SSH_OPTS=(-o ConnectTimeout=15)
[ -n "${SSH_KEY:-}" ] && SSH_OPTS+=(-i "$SSH_KEY")
remote() { ssh "${SSH_OPTS[@]}" "$HOST" "$@"; }

if [ -z "${WEB_DIST:-}" ]; then
  echo "▶ 构建前端…"
  npm run build >/dev/null
  WEB_DIST=dist
fi
[ -f "$WEB_DIST/index.html" ] || { echo "没找到 $WEB_DIST/index.html"; exit 1; }
# 私人素材绝不能被打进前端（前端是公开的）
for f in photos photos.json voices voices.json memories.json data anniversaries.json footprints.json; do
  [ -e "$WEB_DIST/$f" ] && { echo "!! $WEB_DIST/$f 不该出现在前端里，已停止"; exit 1; }
done

echo "▶ 上传…"
remote 'rm -rf /srv/xlovey/.upload && mkdir -p /srv/xlovey/.upload'
tar czf - --exclude=node_modules --exclude=.env --exclude=data --exclude=test server | remote 'cat > /srv/xlovey/.upload/server.tgz'
tar czf - private | remote 'cat > /srv/xlovey/.upload/private.tgz'
tar czf - -C "$WEB_DIST" . | remote 'cat > /srv/xlovey/.upload/web.tgz'

echo "▶ 在服务器上更新…"
remote 'bash -s' <<'REMOTE'
set -euo pipefail
S=/srv/xlovey
U=$S/.upload

# --- 后端代码（保留 node_modules、.env、data）
rm -rf $U/stage && mkdir $U/stage && tar xzf $U/server.tgz -C $U/stage --no-same-owner
cd $S/server
rm -rf routes media storage jobs scripts *.js package.json package-lock.json
cp -r $U/stage/server/. $S/server/
chown -R xlovey:xlovey $S/server
chmod -R u=rwX,go=rX routes media storage jobs scripts *.js package.json package-lock.json
NEW=$(sha1sum package-lock.json | cut -d' ' -f1)
if [ ! -d node_modules ] || [ "$NEW" != "$(cat node_modules/.lock-sha 2>/dev/null || true)" ]; then
  echo "  依赖有变化，重新安装…"
  npm ci --omit=dev --no-audit --no-fund >/dev/null 2>&1
  echo "$NEW" > node_modules/.lock-sha
  chown -R xlovey:xlovey node_modules
fi

# --- 故事页素材（整个换掉）
rm -rf $U/stage && mkdir $U/stage && tar xzf $U/private.tgz -C $U/stage --no-same-owner
rm -rf $S/private && mv $U/stage/private $S/private
chown -R xlovey:xlovey $S/private && chmod -R u=rwX,go=rX $S/private

# --- 重启后端，等它起来
systemctl restart xlovey
for i in $(seq 1 15); do
  curl -fs http://127.0.0.1:3020/api/health >/dev/null 2>&1 && break
  [ "$i" = 15 ] && { echo "后端没起来："; journalctl -u xlovey -n 15 --no-pager; exit 1; }
  sleep 1
done
echo "  后端已重启并通过健康检查"

# --- 前端：传到新目录再整体替换，站点不会出现传到一半的状态
W=/var/www/xlovey.cn
rm -rf $W.new $W.old && mkdir $W.new
tar xzf $U/web.tgz -C $W.new --no-same-owner
chown -R nginx:nginx $W.new
find $W.new -type d -exec chmod 755 {} + && find $W.new -type f -exec chmod 644 {} + && chmod 700 $W.new
mv $W $W.old && mv $W.new $W && rm -rf $W.old
echo "  前端已切换"
rm -rf $U
REMOTE

echo "▶ 检查线上…"
code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/api/health" || true)
[ "$code" = 200 ] || { echo "!! https://$DOMAIN/api/health 返回 $code"; exit 1; }
for f in photos.json voices.json memories.json; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/$f" || true)
  [ "$code" = 404 ] || { echo "!! https://$DOMAIN/$f 返回 $code（应该是 404，私人素材不能被直接访问）"; exit 1; }
done
echo "✓ 部署完成：https://$DOMAIN"
