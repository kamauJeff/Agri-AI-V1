import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle } from 'react-native-svg'
import { router } from 'expo-router'
import { useCreditScore, useCreditHistory, useRefreshCredit } from '@/hooks/useApi'
import { colors, spacing, radius, shadows } from '@/lib/theme'
import { formatKes, getCreditRatingColor, scoreToPercent } from '@/lib/utils'

function ScoreRing({ score }: { score: number }) {
  const SIZE = 180
  const STROKE = 14
  const R = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * R
  const pct = scoreToPercent(score) / 100
  const color = getCreditRatingColor(
    score < 500 ? 'POOR' : score < 600 ? 'FAIR' : score < 700 ? 'GOOD' : score < 750 ? 'VERY_GOOD' : 'EXCELLENT'
  )

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.gray[100]}
          strokeWidth={STROKE} fill="none" />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={color}
          strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - pct)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 40, fontWeight: '800', color: colors.gray[900] }}>{score}</Text>
        <Text style={{ fontSize: 12, color: colors.gray[500] }}>out of 850</Text>
      </View>
    </View>
  )
}

function FactorBar({ factor, score, maxScore, description }: any) {
  const pct = score / maxScore
  const barColor = pct >= 0.7 ? colors.brand[600] : pct >= 0.4 ? colors.amber[500] : '#ef4444'
  return (
    <View style={fb.wrap}>
      <View style={fb.row}>
        <Text style={fb.name}>{factor}</Text>
        <Text style={fb.score}>{score}/{maxScore}</Text>
      </View>
      <View style={fb.track}>
        <View style={[fb.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={fb.desc}>{description}</Text>
    </View>
  )
}
const fb = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 13, fontWeight: '600', color: colors.gray[800] },
  score: { fontSize: 13, color: colors.gray[500] },
  track: { height: 6, backgroundColor: colors.gray[100], borderRadius: radius.full, overflow: 'hidden', marginBottom: 4 },
  fill: { height: '100%', borderRadius: radius.full },
  desc: { fontSize: 11, color: colors.gray[400] },
})

export default function CreditScreen() {
  const { data: score, isLoading, refetch } = useCreditScore()
  const { data: history } = useCreditHistory()
  const refresh = useRefreshCredit()
  const [refreshing, setRefreshing] = useState(false)

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.brand[600]} /></View>
  }

  if (!score) {
    return (
      <View style={s.center}>
        <Ionicons name="card-outline" size={64} color={colors.gray[300]} />
        <Text style={s.noScoreText}>No credit score yet</Text>
        <Text style={s.noScoreSub}>Complete your farm profile to get scored</Text>
      </View>
    )
  }

  const ratingColor = getCreditRatingColor(score.rating)
  const factors = score.factors as any[]

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[600]} />}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: ratingColor }]}>
        <Text style={s.headerTitle}>Credit Score</Text>
        <View style={s.ringWrap}>
          <ScoreRing score={score.score} />
        </View>
        <View style={s.ratingBadge}>
          <Text style={s.ratingText}>{score.rating.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={s.body}>
        {/* Max loan */}
        <View style={[s.loanCard, shadows.md]}>
          <View>
            <Text style={s.loanLabel}>Maximum loan amount</Text>
            <Text style={s.loanAmount}>{formatKes(score.maxLoanAmountKes)}</Text>
          </View>
          <TouchableOpacity
            style={s.applyBtn}
            onPress={() => router.push('/(tabs)/loans')}
          >
            <Text style={s.applyBtnText}>Apply →</Text>
          </TouchableOpacity>
        </View>

        {/* Refresh */}
        <TouchableOpacity
          style={[s.refreshBtn, refresh.isPending && { opacity: 0.6 }]}
          onPress={() => refresh.mutate()}
          disabled={refresh.isPending}
        >
          {refresh.isPending
            ? <ActivityIndicator size="small" color={colors.brand[600]} />
            : <><Ionicons name="refresh" size={16} color={colors.brand[600]} /><Text style={s.refreshText}>Refresh score</Text></>}
        </TouchableOpacity>

        {/* Factors */}
        <View style={[s.card, shadows.sm]}>
          <Text style={s.cardTitle}>Score breakdown</Text>
          {factors.map((f: any) => <FactorBar key={f.factor} {...f} />)}
        </View>

        {/* Score ranges */}
        <View style={[s.card, shadows.sm]}>
          <Text style={s.cardTitle}>Score ranges</Text>
          {[
            { range: '300–499', label: 'Poor',      color: '#dc2626', max: '10K' },
            { range: '500–599', label: 'Fair',      color: '#d97706', max: '50K' },
            { range: '600–699', label: 'Good',      color: '#ca8a04', max: '150K' },
            { range: '700–749', label: 'Very Good', color: '#16a34a', max: '500K' },
            { range: '750–850', label: 'Excellent', color: '#15803d', max: '2M' },
          ].map((r) => {
            const isActive = score.rating === r.label.toUpperCase().replace(' ', '_')
            return (
              <View key={r.range} style={[s.rangeRow, isActive && { backgroundColor: r.color + '12' }]}>
                <View style={[s.rangeDot, { backgroundColor: r.color }]} />
                <Text style={s.rangeLabel}>{r.label}</Text>
                <Text style={s.rangeRange}>{r.range}</Text>
                <Text style={[s.rangeMax, { color: r.color }]}>KES {r.max}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  noScoreText: { fontSize: 16, fontWeight: '600', color: colors.gray[600] },
  noScoreSub: { fontSize: 13, color: colors.gray[400], textAlign: 'center' },
  header: { paddingTop: 56, paddingBottom: 32, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: spacing.lg },
  ringWrap: {
    width: 200, height: 200, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderRadius: 100,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  ratingBadge: {
    marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.white, textTransform: 'uppercase', letterSpacing: 1 },
  body: { padding: spacing.xl },
  loanCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md,
  },
  loanLabel: { fontSize: 12, color: colors.gray[500] },
  loanAmount: { fontSize: 22, fontWeight: '800', color: colors.brand[700], marginTop: 2 },
  applyBtn: { backgroundColor: colors.brand[600], borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.brand[200], borderRadius: radius.md,
    paddingVertical: 12, marginBottom: spacing.xl, backgroundColor: colors.white,
  },
  refreshText: { fontSize: 14, fontWeight: '600', color: colors.brand[600] },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg },
  rangeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md,
  },
  rangeDot: { width: 10, height: 10, borderRadius: 5 },
  rangeLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.gray[800] },
  rangeRange: { fontSize: 12, color: colors.gray[500] },
  rangeMax: { fontSize: 12, fontWeight: '700', minWidth: 48, textAlign: 'right' },
})
