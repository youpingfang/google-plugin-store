const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
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
    
    const res = await fetch(`${API_BASE}/upload/screenshot`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  
  uploadPackage: async (file, data) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const res = await fetch(`${API_BASE}/upload/package`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
};
