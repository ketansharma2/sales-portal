/**
 * API Client Helper
 * Handles authenticated API requests using HttpOnly cookies
 * Replaces the old pattern of manually adding Authorization headers
 */

/**
 * Make an authenticated API request
 * Cookies are automatically included in the request
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} - Fetch response
 */
export async function apiRequest(url, options = {}) {
  const defaultOptions = {
    credentials: 'include', // Important: Include cookies in request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
}

/**
 * GET request helper
 */
export async function apiGet(url, options = {}) {
  return apiRequest(url, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request helper
 */
export async function apiPut(url, data, options = {}) {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete(url, options = {}) {
  return apiRequest(url, { ...options, method: 'DELETE' });
}

/**
 * Upload file with FormData
 */
export async function apiUpload(url, formData, options = {}) {
  const uploadOptions = {
    credentials: 'include',
    ...options,
    method: options.method || 'POST',
    body: formData,
  };
  
  // Don't set Content-Type for FormData - browser will set it with boundary
  if (uploadOptions.headers?.['Content-Type']) {
    delete uploadOptions.headers['Content-Type'];
  }
  
  return fetch(url, uploadOptions);
}
