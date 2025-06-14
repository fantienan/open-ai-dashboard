import { AI_SERVER_BASE_URL, AI_SERVER_ROOT_PATH, WEB_SERVER_BASE_URL, WEB_SERVER_ROOT_PATH } from '@/lib/constant'
import { storage } from '../storage'
// 中间件类型定义
export type FetchMiddleware = {
  request?: (
    input: RequestInfo | URL,
    init?: RequestInit & { response?: true },
  ) => [RequestInfo | URL, RequestInit | undefined]
  response?: (response: Response) => Promise<Response>
  error?: (error: Error, input: RequestInfo | URL, init?: RequestInit) => Promise<Response | Error>
}

const authMiddleware: FetchMiddleware = {
  request: (input, init) => {
    // 在请求中添加认证头部
    const headers = new Headers(init?.headers)
    const token = storage.getToken()
    if (!token) {
      headers.delete('Authorization')
    } else {
      headers.set('Authorization', token)
    }
    return [input, { ...init, headers }]
  },
  response: async (response) => {
    if (response.headers.has('Authorization')) {
      storage.setToken(response.headers.get('Authorization')!)
    }
    return response
  },
}

const urlMiddleware: FetchMiddleware = {
  request: (input, init) => {
    let i = input
    if (typeof input === 'string' && !input.startsWith('http')) {
      if (input.startsWith(WEB_SERVER_ROOT_PATH)) {
        i = input.replace(WEB_SERVER_ROOT_PATH, WEB_SERVER_BASE_URL)
      } else if (input.startsWith(AI_SERVER_ROOT_PATH)) {
        i = input.replace(AI_SERVER_ROOT_PATH, AI_SERVER_BASE_URL)
      }
    }
    return [i, init]
  },
}

// 存储中间件的数组
export const middlewares: FetchMiddleware[] = [urlMiddleware, authMiddleware]

// 添加中间件的函数
export function addMiddleware(middleware: FetchMiddleware) {
  middlewares.push(middleware)
}
