export interface BizResult<T = any> {
  data?: T | null
  code?: number
  message?: string
  success?: boolean
}
