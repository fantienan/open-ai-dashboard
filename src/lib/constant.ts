export const AI_SERVER_BASE_URL = import.meta.env.BIZ_AI_SERVER_URL
export const WEB_SERVER_BASE_URL = import.meta.env.BIZ_WEB_SERVER_URL
export const WEB_SERVER_ROOT_PATH = `/${WEB_SERVER_BASE_URL.split('/').at(-1)!}`
export const AI_SERVER_ROOT_PATH = `/${AI_SERVER_BASE_URL.split('/').at(-1)!}`
