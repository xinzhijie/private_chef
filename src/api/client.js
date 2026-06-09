let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(path, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options

  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {})
    },
    ...fetchOptions,
    body: fetchOptions.body !== undefined ? JSON.stringify(fetchOptions.body) : undefined
  })

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    if (!skipAuthRedirect) {
      unauthorizedHandler?.(data)
    }
    const error = new Error(data.message || '登录已过期')
    error.status = 401
    error.expired = data.expired
    throw error
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || '请求失败')
  }

  return data
}

export const api = {
  get(path, params, options = {}) {
    const qs = params
      ? `?${new URLSearchParams(
          Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        )}`
      : ''
    return request(`${path}${qs}`, options)
  },
  post(path, body, options = {}) {
    return request(path, { method: 'POST', body, ...options })
  },
  put(path, body, options = {}) {
    return request(path, { method: 'PUT', body, ...options })
  },
  patch(path, body, options = {}) {
    return request(path, { method: 'PATCH', body, ...options })
  },
  del(path, body, options = {}) {
    return request(path, { method: 'DELETE', body, ...options })
  }
}
