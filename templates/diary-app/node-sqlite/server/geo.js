// 坐标工具。高德用的是 GCJ-02（国内的加偏坐标），手机照片 / 视频里的定位是 WGS-84（GPS 原始坐标），
// 两者在国内差几百米，放到高德地图上之前要先转一下。国外不加偏，原样返回。
const A = 6378245.0
const EE = 0.00669342162296594323
const PI = Math.PI

export const outOfChina = (lat, lng) => lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271

const tLat = (x, y) => {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  r += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3
  r += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3
  r += ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3
  return r
}
const tLng = (x, y) => {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  r += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3
  r += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3
  r += ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3
  return r
}

export function wgs84ToGcj02(lat, lng) {
  if (outOfChina(lat, lng)) return { lat, lng }
  let dLat = tLat(lng - 105, lat - 35)
  let dLng = tLng(lng - 105, lat - 35)
  const rad = (lat / 180) * PI
  let magic = Math.sin(rad)
  magic = 1 - EE * magic * magic
  const sq = Math.sqrt(magic)
  dLat = (dLat * 180) / (((A * (1 - EE)) / (magic * sq)) * PI)
  dLng = (dLng * 180) / ((A / sq) * Math.cos(rad) * PI)
  return { lat: lat + dLat, lng: lng + dLng }
}

// 两点之间的球面距离（公里）
export function haversineKm(a, b) {
  const R = 6371
  const rad = (d) => (d * PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
