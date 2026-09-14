export const API_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  return await fetch(`${API_URL}${endpoint}`, config);
}
