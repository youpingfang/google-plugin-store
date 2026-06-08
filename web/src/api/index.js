const API_BASE = '/api';
const TOKEN_KEY = 'plugin_store_jwt';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, options = {}) {
  const token = auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    const err = new Error(error.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// FormData requests (uploads) need a slightly different wrapper because
// the browser sets its own Content-Type with boundary.
async function upload(path, formData) {
  const token = auth.getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Upload failed' }));
    const err = new Error(error.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  // Plugins
  getPlugins: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/plugins${query ? '?' + query : ''}`);
  },
  
  getPlugin: (id) => request(`/plugins/${id}`),
  
  createPlugin: (data) => request('/plugins', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  updatePlugin: (id, data) => request(`/plugins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  deletePlugin: (id) => request(`/plugins/${id}`, { method: 'DELETE' }),
  
  recordInstall: (id) => request(`/plugins/${id}/install`, { method: 'POST' }),
  
  // GitHub
  detectGitHub: (repoUrl, token) => request('/github/detect', {
    method: 'POST',
    body: JSON.stringify({ repoUrl, token })
  }),
  
  importGitHub: (data) => request('/github/import', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Upload
  uploadIcon: async (file, pluginId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pluginId) formData.append('pluginId', pluginId);
    
    const res = await fetch(`${API_BASE}/upload/icon`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  
  uploadScreenshot: async (file, pluginId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (pluginId) formData.append('pluginId', pluginId);
    return upload('/upload/screenshot', formData);
  },

  uploadPackage: async (file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return upload('/upload/package', formData);
  },

  // Auth
  login: (token) => request('/auth/login', { method: 'POST', body: JSON.stringify({ token }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};
