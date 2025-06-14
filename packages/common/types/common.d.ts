export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type MakeRequiredAndOptional<T, K extends keyof T> = {
  [P in K]-?: T[P]
} & {
  [P in Exclude<keyof T, K>]?: T[P]
}

export type MakeReqiured<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P]
}
