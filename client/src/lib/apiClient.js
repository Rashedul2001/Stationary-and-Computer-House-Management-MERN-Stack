export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const err = new Error(payload?.message || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload?.data !== undefined ? payload.data : payload;
}

export const apiClient = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
