interface ApplicationError extends Error {
  info: string
  status: number
}

export const fetcher = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as ApplicationError
    error.info = await res.json()
    error.status = res.status
    throw error
  }
  return res.json()
}
