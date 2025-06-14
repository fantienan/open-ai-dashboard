const storageIdPrefix = 'ai-dashboard'

const getStorageId = (id: string) => `${storageIdPrefix}-${id}`

export const storage = {
  /**
   * @description 读取 localStorage
   * @param id 存储的 id
   * @returns
   */
  getItem: (id: string) => {
    try {
      const item = localStorage.getItem(getStorageId(id))
      if (!item) return null
      const parsed = JSON.parse(item)
      if (parsed.expire && parsed.expire < Date.now()) {
        localStorage.removeItem(getStorageId(id))
        return null
      }
      return parsed.value
    } catch (e) {
      console.error('解析 localStorage 时出错', e)
    }
  },
  /**
   *
   * @description 设置 localStorage
   * @param id 存储的 id
   * @param data 数据
   * @param expire 过期时间，单位秒
   */
  setItem: (id: string, data: any, expire?: number) => {
    try {
      const value = JSON.stringify({
        value: data,
        expire: expire ? Date.now() + expire * 1000 : undefined,
      })
      localStorage.setItem(getStorageId(id), value)
    } catch (e) {
      console.error('设置 localStorage 时出错', e)
    }
  },
  /**
   *
   * @description 根据 id 删除 localStorage
   * @param id 存储的 id
   */
  removeItem: (id: string) => {
    try {
      localStorage.removeItem(getStorageId(id))
    } catch (e) {
      console.error('删除 localStorage 时出错', e)
    }
  },
  /**
   * @description 清空 localStorage 中以 storageIdPrefix 开头的所有数据
   */
  clear: () => {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(storageIdPrefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (e) {
      console.error('清空 localStorage 时出错', e)
    }
  },

  getToken: () => {
    try {
      const token = storage.getItem('token')
      if (!token) return null
      return token
    } catch (e) {
      console.error('获取 token 时出错', e)
    }
  },

  setToken: (value: string) => {
    try {
      storage.setItem('token', value, 60 * 60 * 24 * 7) // 7天过期
    } catch (e) {
      console.error('设置 token 时出错', e)
    }
  },
}
