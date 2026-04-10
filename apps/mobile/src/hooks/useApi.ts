import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  farmsApi, fieldsApi, weatherApi,
  marketApi, creditApi, loansApi, predictApi,
} from '../api/endpoints'

// ─── Farms ───────────────────────────────────────────────────────────────────
export const useFarms = () =>
  useQuery({ queryKey: ['farms'], queryFn: () => farmsApi.list().then(r => r.data.data) })

export const useFarmsSummary = () =>
  useQuery({ queryKey: ['farms-summary'], queryFn: () => farmsApi.summary().then(r => r.data.data) })

export const useFarm = (id: string) =>
  useQuery({ queryKey: ['farms', id], queryFn: () => farmsApi.get(id).then(r => r.data.data), enabled: !!id })

export const useCreateFarm = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: farmsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  })
}

export const useDeleteFarm = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: farmsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  })
}

// ─── Fields ──────────────────────────────────────────────────────────────────
export const useFields = (farmId: string) =>
  useQuery({
    queryKey: ['fields', farmId],
    queryFn: () => fieldsApi.list(farmId).then(r => r.data.data),
    enabled: !!farmId,
  })

export const useCreateField = (farmId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fieldsApi.create(farmId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fields', farmId] }); qc.invalidateQueries({ queryKey: ['farms'] }) },
  })
}

// ─── Weather ─────────────────────────────────────────────────────────────────
export const useWeatherForecast = (farmId: string) =>
  useQuery({
    queryKey: ['weather', farmId],
    queryFn: () => weatherApi.forecast(farmId).then(r => r.data.data),
    enabled: !!farmId,
    staleTime: 30 * 60 * 1000,
  })

export const useWeatherAlerts = (farmId: string) =>
  useQuery({
    queryKey: ['weather-alerts', farmId],
    queryFn: () => weatherApi.alerts(farmId).then(r => r.data.data),
    enabled: !!farmId,
  })

// ─── Market ──────────────────────────────────────────────────────────────────
export const useMarketPrices = (params?: any) =>
  useQuery({
    queryKey: ['market-prices', params],
    queryFn: () => marketApi.prices(params).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })

export const useLatestPrices = (county?: string) =>
  useQuery({
    queryKey: ['market-latest', county],
    queryFn: () => marketApi.latest(county).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })

export const useCrops = () =>
  useQuery({ queryKey: ['crops'], queryFn: () => marketApi.crops().then(r => r.data.data), staleTime: Infinity })

export const useCounties = () =>
  useQuery({ queryKey: ['counties'], queryFn: () => marketApi.counties().then(r => r.data.data), staleTime: Infinity })

// ─── Credit ──────────────────────────────────────────────────────────────────
export const useCreditScore = () =>
  useQuery({ queryKey: ['credit-score'], queryFn: () => creditApi.score().then(r => r.data.data) })

export const useCreditHistory = () =>
  useQuery({ queryKey: ['credit-history'], queryFn: () => creditApi.history().then(r => r.data.data) })

export const useRefreshCredit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: creditApi.refresh,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credit-score'] }); qc.invalidateQueries({ queryKey: ['credit-history'] }) },
  })
}

// ─── Loans ───────────────────────────────────────────────────────────────────
export const useLoans = () =>
  useQuery({ queryKey: ['loans'], queryFn: () => loansApi.list().then(r => r.data.data) })

export const useLoan = (id: string) =>
  useQuery({ queryKey: ['loans', id], queryFn: () => loansApi.get(id).then(r => r.data.data), enabled: !!id })

export const useApplyLoan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: loansApi.apply,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); qc.invalidateQueries({ queryKey: ['credit-score'] }) },
  })
}

// ─── Predict ─────────────────────────────────────────────────────────────────
export const usePrediction = () => useMutation({ mutationFn: predictApi.predict })
