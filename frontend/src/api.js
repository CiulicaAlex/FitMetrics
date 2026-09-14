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

export async function getApiErrorMessage(response, fallbackMessage) {
  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return 'Serverul public este momentan indisponibil. Încearcă din nou în câteva secunde.';
  }

  if (contentType.includes('application/json')) {
    try {
      const json = JSON.parse(responseText);
      if (typeof json === 'string' && json.trim()) return json;
      if (json?.message) return json.message;
      if (json?.title) return json.title;
    } catch {
      // Fall back to the friendly default below.
    }
  }

  if (responseText && !responseText.trim().toLowerCase().startsWith('<!doctype html')) {
    return responseText.length <= 240 ? responseText : fallbackMessage;
  }

  return fallbackMessage;
}
