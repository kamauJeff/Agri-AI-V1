import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Switch,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { usePrediction, useFarms } from '@/hooks/useApi'
import { CROPS, getCurrentSeason } from '@agriai/shared'
import { colors, spacing, radius, shadows } from '@/lib/theme'
import { formatKes, formatNumber } from '@/lib/utils'

const SOIL_TYPES = ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM', 'CLAY', 'SANDY', 'SILT', 'PEAT', 'CHALK']

function ResultCard({ result }: { result: any }) {
  return (
    <View style={[rc.card, shadows.md]}>
      <LinearGradient colors={['#166534', '#15803d']} style={rc.header}>
        <Ionicons name="leaf" size={32} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', right: 20, top: 16 }} />
        <Text style={rc.headerSub}>Predicted yield for</Text>
        <Text style={rc.headerCrop}>{result.cropName}</Text>
      </LinearGradient>

      {/* Metrics */}
      <View style={rc.metrics}>
        <View style={rc.metric}>
          <Text style={rc.metricValue}>{formatNumber(result.predictedYieldKg)} kg</Text>
          <Text style={rc.metricLabel}>Total yield</Text>
        </View>
        <View style={rc.divider} />
        <View style={rc.metric}>
          <Text style={rc.metricValue}>{formatNumber(result.predictedYieldPerAcre)}</Text>
          <Text style={rc.metricLabel}>kg / acre</Text>
        </View>
        <View style={rc.divider} />
        <View style={rc.metric}>
          <Text style={[rc.metricValue, { color: colors.brand[700] }]}>{formatKes(result.estimatedRevenueKes)}</Text>
          <Text style={rc.metricLabel}>Est. revenue</Text>
        </View>
      </View>

      {/* Confidence */}
      <View style={rc.confWrap}>
        <Text style={rc.confLabel}>Confidence: {result.confidencePct}%</Text>
        <View style={rc.confTrack}>
          <View style={[rc.confFill, {
            width: `${result.confidencePct}%` as any,
            backgroundColor: result.confidencePct >= 75 ? colors.brand[500] : result.confidencePct >= 55 ? colors.amber[500] : '#ef4444',
          }]} />
        </View>
      </View>

      {/* Recommendations */}
      <View style={rc.section}>
        <View style={rc.sectionHeader}>
          <Ionicons name="checkmark-circle" size={16} color={colors.brand[600]} />
          <Text style={rc.sectionTitle}>Recommendations</Text>
        </View>
        {result.recommendations.map((r: string, i: number) => (
          <View key={i} style={rc.listItem}>
            <Text style={rc.arrow}>→</Text>
            <Text style={rc.listText}>{r}</Text>
          </View>
        ))}
      </View>

      {/* Risks */}
      <View style={rc.section}>
        <View style={rc.sectionHeader}>
          <Ionicons name="warning" size={16} color={colors.amber[500]} />
          <Text style={rc.sectionTitle}>Risk factors</Text>
        </View>
        {result.riskFactors.map((r: string, i: number) => (
          <View key={i} style={rc.listItem}>
            <Text style={rc.warn}>⚠</Text>
            <Text style={rc.listText}>{r}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const rc = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xl },
  header: { padding: spacing.xl, paddingTop: spacing['2xl'] },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  headerCrop: { fontSize: 26, fontWeight: '800', color: colors.white, marginTop: 2 },
  metrics: { flexDirection: 'row', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '800', color: colors.gray[900] },
  metricLabel: { fontSize: 10, color: colors.gray[500], marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.gray[100] },
  confWrap: { padding: spacing.xl, paddingBottom: 0 },
  confLabel: { fontSize: 12, fontWeight: '600', color: colors.gray[600], marginBottom: 6 },
  confTrack: { height: 6, backgroundColor: colors.gray[100], borderRadius: radius.full, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: radius.full },
  section: { padding: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.gray[800] },
  listItem: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  arrow: { color: colors.brand[600], fontSize: 13, fontWeight: '700' },
  warn: { fontSize: 13 },
  listText: { flex: 1, fontSize: 13, color: colors.gray[600], lineHeight: 18 },
})

export default function PredictScreen() {
  const predict = usePrediction()
  const { data: farms } = useFarms()
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    crop: 'Maize', soilType: 'LOAM', areaAcres: '',
    rainfallMm: '', tempAvgC: '', fertilizerUsed: false,
    irrigated: false, season: getCurrentSeason(),
  })

  // All fields across all farms
  const allFields = farms?.flatMap((f: any) =>
    (f.fields ?? []).map((fi: any) => ({ ...fi, farmName: f.name }))
  ) ?? []

  function fillFromField(field: any) {
    setForm(f => ({
      ...f,
      soilType: field.soilType,
      areaAcres: String(field.areaAcres),
      crop: field.currentCrop ?? f.crop,
    }))
  }

  async function handlePredict() {
    setError('')
    if (!form.areaAcres || !form.rainfallMm || !form.tempAvgC) {
      return setError('Please fill in all required fields')
    }
    try {
      const res = await predict.mutateAsync({
        ...form,
        areaAcres: Number(form.areaAcres),
        rainfallMm: Number(form.rainfallMm),
        tempAvgC: Number(form.tempAvgC),
      })
      setResult(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Prediction failed')
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <LinearGradient colors={['#166534', '#15803d']} style={s.header}>
        <Text style={s.title}>AI Yield Prediction</Text>
        <Text style={s.sub}>Kenya-specific crop yield estimates</Text>
      </LinearGradient>

      <View style={s.body}>
        {/* Quick fill */}
        {allFields.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Quick-fill from field</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {allFields.map((field: any) => (
                  <TouchableOpacity key={field.id} style={s.chip} onPress={() => fillFromField(field)}>
                    <Text style={s.chipText}>{field.farmName} — {field.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>Prediction inputs</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Crop */}
          <Text style={s.label}>Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CROPS.slice(0, 16).map((c) => (
                <TouchableOpacity key={c} style={[s.chip, form.crop === c && s.chipActive]}
                  onPress={() => setForm({ ...form, crop: c })}>
                  <Text style={[s.chipText, form.crop === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Soil */}
          <Text style={s.label}>Soil type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SOIL_TYPES.map((st) => (
                <TouchableOpacity key={st} style={[s.chip, form.soilType === st && s.chipActive]}
                  onPress={() => setForm({ ...form, soilType: st })}>
                  <Text style={[s.chipText, form.soilType === st && s.chipTextActive]}>{st.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Season */}
          <Text style={s.label}>Season</Text>
          <View style={[s.chipRow, { marginBottom: spacing.lg }]}>
            {(['LONG_RAINS', 'SHORT_RAINS', 'DRY'] as const).map((season) => (
              <TouchableOpacity key={season} style={[s.chip, form.season === season && s.chipActive]}
                onPress={() => setForm({ ...form, season })}>
                <Text style={[s.chipText, form.season === season && s.chipTextActive]}>
                  {season === 'LONG_RAINS' ? 'Long Rains' : season === 'SHORT_RAINS' ? 'Short Rains' : 'Dry'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Numeric inputs */}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Area (acres) *</Text>
              <TextInput style={s.input} placeholder="e.g. 5" placeholderTextColor={colors.gray[400]}
                keyboardType="numeric" value={form.areaAcres}
                onChangeText={(v) => setForm({ ...form, areaAcres: v })} />
            </View>
            <View style={{ width: spacing.lg }} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Rainfall (mm) *</Text>
              <TextInput style={s.input} placeholder="e.g. 500" placeholderTextColor={colors.gray[400]}
                keyboardType="numeric" value={form.rainfallMm}
                onChangeText={(v) => setForm({ ...form, rainfallMm: v })} />
            </View>
          </View>

          <Text style={s.label}>Avg temperature (°C) *</Text>
          <TextInput style={s.input} placeholder="e.g. 22" placeholderTextColor={colors.gray[400]}
            keyboardType="numeric" value={form.tempAvgC}
            onChangeText={(v) => setForm({ ...form, tempAvgC: v })} />

          {/* Toggles */}
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Using fertilizer</Text>
            <Switch value={form.fertilizerUsed} onValueChange={(v) => setForm({ ...form, fertilizerUsed: v })}
              trackColor={{ false: colors.gray[200], true: colors.brand[400] }}
              thumbColor={form.fertilizerUsed ? colors.brand[600] : colors.gray[400]} />
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Irrigated field</Text>
            <Switch value={form.irrigated} onValueChange={(v) => setForm({ ...form, irrigated: v })}
              trackColor={{ false: colors.gray[200], true: colors.brand[400] }}
              thumbColor={form.irrigated ? colors.brand[600] : colors.gray[400]} />
          </View>

          <TouchableOpacity
            style={[s.predictBtn, predict.isPending && { opacity: 0.6 }]}
            onPress={handlePredict} disabled={predict.isPending} activeOpacity={0.8}
          >
            {predict.isPending
              ? <ActivityIndicator color={colors.white} />
              : <><Ionicons name="flash" size={18} color={colors.white} /><Text style={s.predictBtnText}>Predict yield</Text></>}
          </TouchableOpacity>
        </View>

        {result && <ResultCard result={result} />}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  body: { padding: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.md, backgroundColor: '#fee2e2', padding: spacing.md, borderRadius: radius.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md,
    height: 48, paddingHorizontal: spacing.md, fontSize: 15, color: colors.gray[900], marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7, backgroundColor: colors.white },
  chipActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  chipText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  chipTextActive: { color: colors.brand[700], fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  toggleLabel: { fontSize: 14, color: colors.gray[700] },
  predictBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand[600], borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.xl,
  },
  predictBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
