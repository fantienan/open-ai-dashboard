import { BizResult } from '@ai-dashboard/common/types'
export class Result {
  /**
   * @description 10000 成功
   */
  static OK = 10000
  /**
   * @description 40000-49999 平台异常
   */
  static SYS_ERROR = 40000
  /**
   * @description 30000-39999 ai 异常
   */
  static AI_ERROR = 30000
  static AI_AGENT_TOOL_ERROR = 30001
  static AI_CHAT_ERROR = 30002
  static TABLE_AGENT_ERROR = 30003

  /**
   * @description 50000 未知异常
   */
  static UN_ERROR = 50000
  /**
   * @description 60000-69999 基本的业务异常
   */
  static BIZ_ERROR = 60000
  /**
   * @description 70000 参数校验异常
   */
  static VALIDATE_ERROR = 70000

  static void() {
    return { code: -1, data: null, message: '' }
  }
  static success<T>(options: BizResult<T> = {}): BizResult<T> {
    const { data = null, code = Result.OK, message = 'success', success = true } = options
    return { code, data, message, success }
  }

  static error<T>(options: BizResult<T> = {}): BizResult<T> {
    const { data = null, code = Result.UN_ERROR, message = 'error', success = false } = options
    return { code, data, message, success }
  }

  static validateError(options: BizResult = {}): BizResult {
    const { data = null, code = Result.VALIDATE_ERROR, message = 'validateError', success = false } = options
    return { code, data, message, success }
  }

  static getCode(code: number) {
    return code ?? Result.UN_ERROR
  }

  static getMessage(code: number) {
    const message = {
      [Result.OK]: '成功',
      [Result.SYS_ERROR]: '系统异常',
      [Result.UN_ERROR]: '未知异常',
      [Result.BIZ_ERROR]: '基本的业务异常',
      [Result.VALIDATE_ERROR]: '参数校验异常',
      [Result.AI_ERROR]: 'AI 异常',
    }
    return message[code] || '未知异常'
  }
}
