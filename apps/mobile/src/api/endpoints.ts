import api from './client'

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
}

export const farmsApi = {
  list: () => api.get('/farms'),
  summary: () => api.get('/farms/summary'),
  get: (id: string) => api.get(`/farms/${id}`),
  create: (data: any) => api.post('/farms', data),
  update: (id: string, data: any) => api.patch(`/farms/${id}`, data),
  delete: (id: string) => api.delete(`/farms/${id}`),
}

export const fieldsApi = {
  list: (farmId: string) => api.get(`/farms/${farmId}/fields`),
  create: (farmId: string, data: any) => api.post(`/farms/${farmId}/fields`, data),
  update: (farmId: string, id: string, data: any) => api.patch(`/farms/${farmId}/fields/${id}`, data),
  delete: (farmId: string, id: string) => api.delete(`/farms/${farmId}/fields/${id}`),
}

export const weatherApi = {
  forecast: (farmId: string) => api.get(`/weather/${farmId}/forecast`),
  alerts: (farmId: string) => api.get(`/weather/${farmId}/alerts`),
}

export const marketApi = {
  prices: (params?: any) => api.get('/market/prices', { params }),
  latest: (county?: string) => api.get('/market/prices/latest', { params: county ? { county } : {} }),
  trend: (crop: string, county?: string) => api.get(`/market/prices/${encodeURIComponent(crop)}/trend`, { params: county ? { county } : {} }),
  crops: () => api.get('/market/crops'),
  counties: () => api.get('/market/counties'),
}

export const creditApi = {
  score: () => api.get('/credit/score'),
  refresh: () => api.post('/credit/score/refresh'),
  history: () => api.get('/credit/score/history'),
}

export const loansApi = {
  list: () => api.get('/loans'),
  get: (id: string) => api.get(`/loans/${id}`),
  apply: (data: any) => api.post('/loans/apply', data),
  repay: (id: string, data: any) => api.post(`/loans/${id}/repay`, data),
}

export const predictApi = {
  predict: (data: any) => api.post('/predict', data),
  predictField: (fieldId: string, data: any) => api.post(`/predict/field/${fieldId}`, data),
  history: (fieldId: string) => api.get(`/predict/field/${fieldId}/history`),
}
