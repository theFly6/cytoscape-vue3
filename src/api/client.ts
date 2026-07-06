import axios from 'axios'

/** 后端 API 根地址，不含末尾斜杠 */
export const apiBase = (import.meta.env.VITE_API_BASE ?? 'http://localhost:3000').replace(/\/$/, '')

/** 拼接完整 API URL，path 以 / 开头 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${normalized}`
}

/** 共享 axios 实例，baseURL 已配置 */
export const api = axios.create({
  baseURL: apiBase,
})
