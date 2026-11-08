#!/bin/bash
# 在服务器上接入高德地图（恋爱地图）：写 Key 到后端的 .env，在 xlovey.cn 的 Nginx 配置里加一段转发，
# 转发时由 Nginx 带上「安全密钥」，所以安全密钥只存在服务器上，不会出现在网页代码里。可以重复运行（会先清掉上次加的）。
#
#   ssh myserver 'bash -s -- 你的Key 你的安全密钥 [样式]' < scripts/setup-amap.sh
#
#   更省事的是在 Mac 上双击项目根目录的「配置高德地图.command」：它会让你输入 Key 和安全密钥（输入时不显示），
#   并且不把它们放在命令行参数里（服务器上 ps 看不到）。这时 Key 等是通过环境变量
#   AMAP_KEY_VALUE / AMAP_CODE_VALUE / AMAP_STYLE_VALUE 传进来的。
#
#   样式不填就用高德自带的「马卡龙」（amap://styles/macaron）。想用自己在高德「个性化地图」里调的样式，
#   填它的样式 ID（形如 amap://styles/xxxxxxxx）。
# 只动 xlovey.cn 自己的配置，改之前先备份；nginx -t 不通过就自动恢复，不会重载。
set -euo pipefail
KEY=${1:-${AMAP_KEY_VALUE:-}}
CODE=${2:-${AMAP_CODE_VALUE:-}}
STYLE=${3:-${AMAP_STYLE_VALUE:-}}
[ -n "$KEY" ] || { echo "缺少高德 Key"; exit 1; }
[ -n "$CODE" ] || { echo "缺少高德安全密钥"; exit 1; }
ENV_FILE=${ENV_FILE:-/srv/xlovey/server/.env}
CONF=${CONF:-/etc/nginx/conf.d/xlovey.cn.conf}
BACKUP_DIR=${BACKUP_DIR:-/srv/xlovey/backup}
[[ "$KEY" =~ ^[A-Za-z0-9]{16,64}$ ]] || { echo "Key 看起来不对（应该是 32 位左右的字母数字）"; exit 1; }
[[ "$CODE" =~ ^[A-Za-z0-9]{16,64}$ ]] || { echo "安全密钥看起来不对（应该是 32 位左右的字母数字）"; exit 1; }
[[ -z "$STYLE" || "$STYLE" =~ ^amap://styles/[A-Za-z0-9_]+$ ]] || { echo "样式要写成 amap://styles/xxxx 的样子"; exit 1; }

# ---- 后端的 .env（Key 是前端本来就要用的；AMAP_PROXY=1 表示安全密钥由 Nginx 带，不要发给前端）
touch "$ENV_FILE"
sed -i '/^AMAP_/d' "$ENV_FILE"
{ echo "AMAP_KEY=$KEY"; echo "AMAP_PROXY=1"; [ -n "$STYLE" ] && echo "AMAP_STYLE=$STYLE"; } >> "$ENV_FILE" || true
echo "✓ 已写入 $ENV_FILE"

# ---- Nginx：加 /_AMapService/ 转发（先备份）
mkdir -p "$BACKUP_DIR"
B="$BACKUP_DIR/$(basename "$CONF").before-amap-$(date +%Y%m%d-%H%M%S)"
cp -a "$CONF" "$B"
python3 - "$CONF" "$CODE" <<'PY'
import re, sys
conf, code = sys.argv[1], sys.argv[2]
s = open(conf).read()
s = re.sub(r"[ \t]*# >>> amap[^\n]*\n.*?# <<< amap\n", "", s, flags=re.S)   # 清掉上次加的
block = f"""    # >>> amap 高德地图：转发时由服务器带上安全密钥（脚本 scripts/setup-amap.sh 生成，别手改）
    location ^~ /_AMapService/v4/map/styles {{
        set $args "$args&jscode={code}";
        proxy_pass https://webapi.amap.com/v4/map/styles;
        # 高德的接口用 JSONP（<script> 加载），返回的类型是 application/json；站点级的 nosniff 会让浏览器拒绝执行。
        # location 里只要写了 add_header，就不再继承 server 级的 add_header（包括 nosniff）。
        add_header Referrer-Policy strict-origin-when-cross-origin;
    }}
    location ^~ /_AMapService/ {{
        set $args "$args&jscode={code}";
        proxy_pass https://restapi.amap.com/;
        # 同上：不加这行，搜地点和逆地理编码会被浏览器拒绝（Refused to execute script … MIME type）
        add_header Referrer-Policy strict-origin-when-cross-origin;
    }}
    # <<< amap
"""
m = re.search(r"^[ \t]*location \^~ /media/ \{", s, flags=re.M)
if not m:
    sys.exit("没找到 location ^~ /media/，不知道该加在哪里")
open(conf, "w").write(s[:m.start()] + block + "\n" + s[m.start():])
PY
chmod 600 "$CONF" 2>/dev/null || true
if [ "${DRY:-}" = 1 ]; then echo "（DRY：不检查 Nginx、不重启）"; exit 0; fi
if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "✓ Nginx 已重载"
else
  cp -a "$B" "$CONF"
  echo "!! nginx -t 没通过，已恢复原配置："; nginx -t 2>&1 | tail -5; exit 1
fi
systemctl restart xlovey
echo "✓ 后端已重启。打开网站首页，应该能看到「恋爱地图」。"
