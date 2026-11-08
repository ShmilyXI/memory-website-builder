// 恋爱地图用到的小工具：高德脚本加载、搜地点、逆地理编码、图钉合并。
import { useEffect, useState } from 'react'

// ---------- 配置：/api/config 给出高德 Key；没配就是 null，地图相关的入口都不显示 ----------
let cfgPromise = null
export function getMapConfig() {
  cfgPromise ??= fetch('/api/config').then((r) => r.json()).then((c) => c.map || null).catch(() => null)
  return cfgPromise
}
// undefined：还在问；null：没配地图；否则是 { key, style, securityCode }
export function useMapConfig() {
  const [c, setC] = useState(undefined)
  useEffect(() => { let on = true; getMapConfig().then((v) => on && setC(v)); return () => { on = false } }, [])
  return c
}

// ---------- 加载高德 JS API 2.0（整个页面只加载一次）----------
// 安全密钥不放在前端：线上由服务器的 Nginx 在 /_AMapService/ 转发时带上；本机开发才用 securityCode 明文。
const PLUGINS = ['AMap.Geocoder', 'AMap.AutoComplete', 'AMap.DistrictLayer']
let loading = null
export function loadAMap(cfg) {
  if (window.AMap?.Map) return Promise.resolve(window.AMap)
  loading ??= new Promise((resolve, reject) => {
    window._AMapSecurityConfig = cfg.securityCode ? { securityJsCode: cfg.securityCode } : { serviceHost: `${location.origin}/_AMapService` }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(cfg.key)}&plugin=${PLUGINS.join(',')}`
    s.async = true
    s.onload = () => (window.AMap ? resolve(window.AMap) : (loading = null, reject(new Error('地图没加载出来'))))
    s.onerror = () => { loading = null; reject(new Error('地图脚本没加载出来，检查一下网络')) }
    document.head.appendChild(s)
  })
  return loading
}

// ---------- 逆地理编码：坐标 → 省 / 市 / 区县代码 ----------
// 直辖市高德返回的 city 是空的，这时候市就用省的名字。
export function regeo(AMap, lng, lat) {
  return new Promise((resolve) => {
    try {
      new AMap.Geocoder({ radius: 1000 }).getAddress([lng, lat], (status, result) => {
        const c = status === 'complete' && result?.regeocode?.addressComponent
        if (!c) return resolve({ province: null, city: null, adcode: null, address: null })
        const province = c.province || null
        const city = (Array.isArray(c.city) ? '' : c.city) || province
        resolve({ province, city, adcode: /^\d{6}$/.test(c.adcode) ? c.adcode : null, address: result.regeocode.formattedAddress || null })
      })
    } catch { resolve({ province: null, city: null, adcode: null, address: null }) }
  })
}

// ---------- 搜地点（输入提示）：返回有坐标的 ----------
let auto = null
export function searchPlaces(AMap, keyword) {
  return new Promise((resolve) => {
    auto ??= new AMap.AutoComplete({ city: '全国' })
    auto.search(keyword, (status, result) => {
      const tips = status === 'complete' ? result?.tips || [] : []
      resolve(tips
        .filter((t) => t.location && (t.location.lng ?? t.location[0]) !== undefined && t.name)
        .map((t) => ({ name: t.name, district: t.district || '', lng: Number(t.location.lng ?? t.location[0]), lat: Number(t.location.lat ?? t.location[1]), adcode: t.adcode || null })))
    })
  })
}

// ---------- 小东西 ----------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const shortDate = (d) => `${Number(d.slice(5, 7))}.${Number(d.slice(8, 10))}`

// 缩小到看全国的时候，挨得近的图钉合成一个带数字的泡泡，免得叠在一起。
// 格子大小 = 大约 64 像素对应的经纬度，所以放大到一定程度就都分开了。
export function groupPins(pins, zoom) {
  const cell = (64 * 360) / (256 * 2 ** zoom)
  const groups = new Map()
  for (const p of pins) {
    const k = `${Math.floor(p.lng / cell)}:${Math.floor(p.lat / cell)}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(p)
  }
  return [...groups.values()].map((list) => ({
    key: list.map((p) => p.id).join('|'),
    pins: list,
    lng: list.reduce((s, p) => s + p.lng, 0) / list.length,
    lat: list.reduce((s, p) => s + p.lat, 0) / list.length,
  }))
}
