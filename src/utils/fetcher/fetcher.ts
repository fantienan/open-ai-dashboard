import { AI_SERVER_BASE_URL } from '@/lib/constant'
import { BizResult } from '@/types'
import { middlewares } from './middleware'

// 函数重载声明
export function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<BizResult<T>>
export function fetcher<T>(input: RequestInfo | URL, init?: RequestInit & { response: true }): Promise<Response>

export async function fetcher<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { response?: true },
): Promise<Response | BizResult<T>> {
  let currentInput = input
  let currentInit = init

  // 应用请求中间件
  for (const middleware of middlewares) {
    if (middleware.request) {
      ;[currentInput, currentInit] = middleware.request(currentInput, currentInit)
    }
  }

  const headers = new Headers(currentInit?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  let i = currentInput
  if (typeof currentInput === 'string' && !currentInput.startsWith('http')) i = `${AI_SERVER_BASE_URL}${currentInput}`

  try {
    let res = await fetch(i, { ...currentInit, headers })

    // 应用响应中间件
    for (const middleware of middlewares) {
      if (middleware.response) {
        res = await middleware.response(res.clone())
      }
    }

    if (currentInit?.response === true) {
      return res
    }

    return res.json() as Promise<BizResult<T>>
  } catch (error) {
    // 应用错误中间件
    let currentError = error as Error
    for (const middleware of middlewares) {
      if (middleware.error) {
        const result = await middleware.error(currentError, currentInput, currentInit)
        if (result instanceof Response) {
          if (currentInit?.response === true) {
            return result
          }
          return result.json() as Promise<BizResult<T>>
        }
        currentError = result as Error
      }
    }
    throw currentError
  }
}
