const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Generic API request handler
 * @param {string} endpoint - The API endpoint (e.g., '/users')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - The response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve token from local storage if needed
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      // Handle HTTP errors
      const errorMessage = data.message || data.errors?.[0]?.msg || 'API Error occurred';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
};

export const apiService = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
