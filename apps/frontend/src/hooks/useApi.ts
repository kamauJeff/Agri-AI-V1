import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { farmsApi, fieldsApi, weatherApi, marketApi, creditApi, loansApi, predictApi, authApi } from '../api/endpoints'
import { toast } from '../components/ui/use-toast'

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => authApi.me().then(r => r.data.data) })
}

// ─── Farms ───────────────────────────────────────────────────────────────────

export function useFarms() {
  return useQuery({ queryKey: ['farms'], queryFn: () => farmsApi.list().then(r => r.data.data) })
}

export function useFarmsSummary() {
  return useQuery({ queryKey: ['farms', 'summary'], queryFn: () => farmsApi.summary().then(r => r.data.data) })
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: ['farms', id],
    queryFn: () => farmsApi.get(id).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useCreateFarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: farmsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farms'] })
      toast({ title: 'Farm created', description: 'Your farm has been added.' })
    },
  })
}

export function useUpdateFarm(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => farmsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farms'] }),
  })
}

export function useDeleteFarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: farmsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farms'] })
      toast({ title: 'Farm deleted' })
    },
  })
}

// ─── Fields ──────────────────────────────────────────────────────────────────

export function useFields(farmId: string) {
  return useQuery({
    queryKey: ['fields', farmId],
    queryFn: () => fieldsApi.list(farmId).then(r => r.data.data),
    enabled: !!farmId,
  })
}

export function useCreateField(farmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fieldsApi.create(farmId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', farmId] })
      qc.invalidateQueries({ queryKey: ['farms'] })
      toast({ title: 'Field added' })
    },
  })
}

export function useUpdateField(farmId: string, fieldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fieldsApi.update(farmId, fieldId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fields', farmId] }),
  })
}

export function useDeleteField(farmId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: string) => fieldsApi.delete(farmId, fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', farmId] })
      qc.invalidateQueries({ queryKey: ['farms'] })
    },
  })
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export function useWeatherForecast(farmId: string) {
  return useQuery({
    queryKey: ['weather', farmId],
    queryFn: () => weatherApi.forecast(farmId).then(r => r.data.data),
    enabled: !!farmId,
    staleTime: 30 * 60 * 1000, // 30 min
  })
}

export function useWeatherAlerts(farmId: string) {
  return useQuery({
    queryKey: ['weather-alerts', farmId],
    queryFn: () => weatherApi.alerts(farmId).then(r => r.data.data),
    enabled: !!farmId,
  })
}

// ─── Market ──────────────────────────────────────────────────────────────────

export function useMarketPrices(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['market-prices', params],
    queryFn: () => marketApi.prices(params).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useLatestPrices(county?: string) {
  return useQuery({
    queryKey: ['market-prices-latest', county],
    queryFn: () => marketApi.latest(county).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function usePriceTrend(crop: string, county?: string) {
  return useQuery({
    queryKey: ['price-trend', crop, county],
    queryFn: () => marketApi.trend(crop, county).then(r => r.data.data),
    enabled: !!crop,
  })
}

export function useCrops() {
  return useQuery({ queryKey: ['crops'], queryFn: () => marketApi.crops().then(r => r.data.data), staleTime: Infinity })
}

export function useCounties() {
  return useQuery({ queryKey: ['counties'], queryFn: () => marketApi.counties().then(r => r.data.data), staleTime: Infinity })
}

// ─── Credit ──────────────────────────────────────────────────────────────────

export function useCreditScore() {
  return useQuery({ queryKey: ['credit-score'], queryFn: () => creditApi.score().then(r => r.data.data) })
}

export function useCreditHistory() {
  return useQuery({ queryKey: ['credit-history'], queryFn: () => creditApi.history().then(r => r.data.data) })
}

export function useRefreshCreditScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: creditApi.refresh,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-score'] })
      qc.invalidateQueries({ queryKey: ['credit-history'] })
      toast({ title: 'Credit score updated' })
    },
  })
}

// ─── Loans ───────────────────────────────────────────────────────────────────

export function useLoans() {
  return useQuery({ queryKey: ['loans'], queryFn: () => loansApi.list().then(r => r.data.data) })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => loansApi.get(id).then(r => r.data.data),
    enabled: !!id,
  })
}

export function useApplyLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: loansApi.apply,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['credit-score'] })
      toast({ title: 'Loan application submitted', description: 'We will review your application.' })
    },
  })
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export function usePrediction() {
  return useMutation({ mutationFn: predictApi.predict })
}

export function usePredictField(fieldId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => predictApi.predictField(fieldId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['predict-history', fieldId] }),
  })
}

export function usePredictHistory(fieldId: string) {
  return useQuery({
    queryKey: ['predict-history', fieldId],
    queryFn: () => predictApi.history(fieldId).then(r => r.data.data),
    enabled: !!fieldId,
  })
}
