// 和后端说话。令牌只放在这个变量里（页面内存）：刷新或关掉页面就没了，下次打开还得再输一遍口令。
let token = null

// 是不是已经输过口令（只有「我们的故事」要口令；令牌放在页面内存里，刷新就没了）
export const isUnlocked = () => token !== null

export async function login(code) {
  const r = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (r.ok) {
    token = (await r.json()).token
    return { ok: true }
  }
  if (r.status === 429) {
    const { retryAfter } = await r.json().catch(() => ({}))
    return { ok: false, locked: true, retryAfter: retryAfter || 900 }
  }
  return { ok: false }
}

export async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { ...opts.headers, authorization: `Bearer ${token}` } })
  if (r.status === 401) {
    // 令牌过期（比如服务器重启过）：回到口令页重新输入。没登录过就不刷新，免得死循环。
    if (token) window.location.reload()
    throw new Error('unauthorized')
  }
  if (r.status === 204) return null
  const data = await r.json().catch(() => null)
  if (!r.ok) throw Object.assign(new Error(data?.message || `HTTP ${r.status}`), { status: r.status, data })
  return data
}

export const post = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
export const patch = (path, body) => api(path, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
export const del = (path) => api(path, { method: 'DELETE' })

// 上传一张图片或一段视频。用 XMLHttpRequest 是因为 fetch 拿不到上传进度。
// onProgress(0~1)；失败时 reject 的错误里带着服务器给的中文提示。
export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/media')
    xhr.setRequestHeader('authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onerror = () => reject(new Error('网络好像断了，点一下重试'))
    xhr.ontimeout = () => reject(new Error('上传太慢了，点一下重试'))
    xhr.onload = () => {
      let data = null
      try { data = JSON.parse(xhr.responseText) } catch { /* 不是 JSON */ }
      if (xhr.status === 401 && token) window.location.reload()
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      reject(new Error(data?.message || (xhr.status === 413 ? '文件太大啦（图片最大 50MB，视频最大 300MB）' : '上传失败了，点一下重试')))
    }
    const fd = new FormData()
    fd.append('file', file)
    xhr.timeout = 25 * 60_000 // 视频大，手机网速慢的时候要传好一会儿
    xhr.send(fd)
  })
}

