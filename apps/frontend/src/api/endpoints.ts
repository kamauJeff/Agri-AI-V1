import api from './client'
import type {
  CreateFarmInput, UpdateFarmInput,
  CreateFieldInput, UpdateFieldInput,
  LoanApplicationInput,
  YieldPredictionInput,
} from '@agriai/shared'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateMe: (data: any) => api.patch('/auth/me', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
}

// ─── Farms ───────────────────────────────────────────────────────────────────

export const farmsApi = {
  list: () => api.get('/farms'),
  summary: () => api.get('/farms/summary'),
  get: (id: string) => api.get(`/farms/${id}`),
  create: (data: CreateFarmInput) => api.post('/farms', data),
  update: (id: string, data: UpdateFarmInput) => api.patch(`/farms/${id}`, data),
  delete: (id: string) => api.delete(`/farms/${id}`),
}

// ─── Fields ──────────────────────────────────────────────────────────────────

export const fieldsApi = {
  list: (farmId: string) => api.get(`/farms/${farmId}/fields`),
  get: (farmId: string, id: string) => api.get(`/farms/${farmId}/fields/${id}`),
  create: (farmId: string, data: CreateFieldInput) => api.post(`/farms/${farmId}/fields`, data),
  update: (farmId: string, id: string, data: UpdateFieldInput) => api.patch(`/farms/${farmId}/fields/${id}`, data),
  delete: (farmId: string, id: string) => api.delete(`/farms/${farmId}/fields/${id}`),
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export const weatherApi = {
  forecast: (farmId: string) => api.get(`/weather/${farmId}/forecast`),
  alerts: (farmId: string) => api.get(`/weather/${farmId}/alerts`),
}

// ─── Market ──────────────────────────────────────────────────────────────────

export const marketApi = {
  prices: (params?: Record<string, any>) => api.get('/market/prices', { params }),
  latest: (county?: string) => api.get('/market/prices/latest', { params: county ? { county } : {} }),
  trend: (crop: string, county?: string) => api.get(`/market/prices/${encodeURIComponent(crop)}/trend`, { params: county ? { county } : {} }),
  crops: () => api.get('/market/crops'),
  counties: () => api.get('/market/counties'),
}

// ─── Credit ──────────────────────────────────────────────────────────────────

export const creditApi = {
  score: () => api.get('/credit/score'),
  refresh: () => api.post('/credit/score/refresh'),
  history: () => api.get('/credit/score/history'),
}

// ─── Loans ───────────────────────────────────────────────────────────────────

export const loansApi = {
  list: () => api.get('/loans'),
  get: (id: string) => api.get(`/loans/${id}`),
  apply: (data: LoanApplicationInput) => api.post('/loans/apply', data),
  repay: (id: string, data: { amountKes: number; reference?: string }) => api.post(`/loans/${id}/repay`, data),
}

// ─── AI Predictions ──────────────────────────────────────────────────────────

export const predictApi = {
  predict: (data: YieldPredictionInput) => api.post('/predict', data),
  predictField: (fieldId: string, data: any) => api.post(`/predict/field/${fieldId}`, data),
  history: (fieldId: string) => api.get(`/predict/field/${fieldId}/history`),
}
