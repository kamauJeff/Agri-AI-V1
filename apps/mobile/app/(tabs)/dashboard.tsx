import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useFarms, useFarmsSummary, useCreditScore, useLatestPrices, useWeatherAlerts } from '@/hooks/useApi'
import { useAuthStore } from '@/store/authStore'
import { colors, spacing, radius, shadows } from '@/lib/theme'
import { formatKes, formatNumber, getFieldStatusColor } from '@/lib/utils'

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <View style={[stat.card, shadows.sm]}>
      <View style={[stat.icon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={stat.value}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
      {sub && <Text style={stat.sub}>{sub}</Text>}
    </View>
  )
}

const stat = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, marginHorizontal: 4,
  },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '700', color: colors.gray[900] },
  label: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  sub: { fontSize: 10, color: colors.gray[400], marginTop: 1 },
})

function FarmCard({ farm }: { farm: any }) {
  const { data: alerts } = useWeatherAlerts(farm.id)
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={[fc.card, shadows.sm]}>
      <TouchableOpacity style={fc.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={fc.iconWrap}>
          <Ionicons name="location" size={20} color={colors.brand[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fc.name}>{farm.name}</Text>
          <Text style={fc.sub}>{farm.county} · {formatNumber(farm.totalAreaAcres, 1)} acres</Text>
          <View style={fc.meta}>
            <Text style={fc.metaText}>{farm._count?.fields ?? farm.fields?.length ?? 0} fields</Text>
            {alerts && alerts.length > 0 && (
              <>
                <Text style={fc.dot}>·</Text>
                <Ionicons name="warning" size={12} color={colors.amber[600]} />
                <Text style={[fc.metaText, { color: colors.amber[700] }]}>{alerts.length} alert{alerts.length > 1 ? 's' : ''}</Text>
              </>
            )}
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray[400]} />
      </TouchableOpacity>

      {expanded && farm.fields?.length > 0 && (
        <View style={fc.fields}>
          {farm.fields.map((field: any) => {
            const sc = getFieldStatusColor(field.status)
            return (
              <View key={field.id} style={fc.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={fc.fieldName}>{field.name}</Text>
                  <Text style={fc.fieldSub}>{formatNumber(field.areaAcres, 1)} ac · {field.soilType.replace('_', ' ')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  {field.currentCrop && <Text style={fc.crop}>{field.currentCrop}</Text>}
                  <View style={[fc.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[fc.badgeText, { color: sc.text }]}>{field.status}</Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const fc = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  sub: { fontSize: 12, color: colors.gray[500], marginTop: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11, color: colors.gray[400] },
  dot: { fontSize: 11, color: colors.gray[300] },
  fields: { borderTopWidth: 1, borderTopColor: colors.gray[100], padding: spacing.md, gap: 8 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.gray[50], borderRadius: radius.md, padding: spacing.md,
  },
  fieldName: { fontSize: 13, fontWeight: '500', color: colors.gray[800] },
  fieldSub: { fontSize: 11, color: colors.gray[500], marginTop: 1 },
  crop: { fontSize: 11, fontWeight: '600', color: colors.brand[700] },
  badge: { borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
})

export default function DashboardScreen() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const { data: farms, isLoading: farmsLoading } = useFarms()
  const { data: summary } = useFarmsSummary()
  const { data: creditScore } = useCreditScore()
  const { data: prices } = useLatestPrices()

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  async function onRefresh() {
    setRefreshing(true)
    await qc.invalidateQueries()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[600]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#14532d', '#166534']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{user?.name?.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard icon="location" label="Farms" value={summary?.totalFarms ?? '—'} sub={`${formatNumber(summary?.totalAreaAcres ?? 0, 1)} acres`} color={colors.brand[600]} />
          <StatCard icon="leaf" label="Active fields" value={summary?.activeFields ?? '—'} sub={`of ${summary?.totalFields ?? 0} total`} color={colors.brand[700]} />
          <StatCard icon="card" label="Credit score" value={creditScore?.score ?? '—'} sub={creditScore?.rating?.replace('_', ' ')} color={colors.amber[600]} />
        </View>

        {/* Farms */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>My Farms</Text>
          {farmsLoading && <ActivityIndicator color={colors.brand[600]} style={{ marginTop: spacing.xl }} />}
          {!farmsLoading && farms?.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="location-outline" size={48} color={colors.gray[300]} />
              <Text style={s.emptyText}>No farms yet</Text>
              <Text style={s.emptySub}>Add your first farm from the web app</Text>
            </View>
          )}
          {farms?.map((farm: any) => <FarmCard key={farm.id} farm={farm} />)}
        </View>

        {/* Market snapshot */}
        {prices && prices.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Market Prices Today</Text>
            <View style={[s.priceCard, shadows.sm]}>
              {prices.slice(0, 6).map((p: any, i: number) => (
                <View key={`${p.crop}-${p.county}`} style={[s.priceRow, i > 0 && s.priceBorder]}>
                  <View>
                    <Text style={s.priceCrop}>{p.crop}</Text>
                    <Text style={s.priceCounty}>{p.county}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.priceValue}>{formatKes(p.priceKes)}</Text>
                    <Text style={s.priceUnit}>per {p.unit === 'KG' ? 'kg' : p.unit.replace('_', ' ').toLowerCase()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  content: { paddingBottom: 32 },
  header: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 26, fontWeight: '700', color: colors.white, marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md },
  body: { padding: spacing.xl, marginTop: -spacing.xl },
  statsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.gray[500], marginTop: spacing.md },
  emptySub: { fontSize: 13, color: colors.gray[400], marginTop: 4 },
  priceCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  priceBorder: { borderTopWidth: 1, borderTopColor: colors.gray[100] },
  priceCrop: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  priceCounty: { fontSize: 11, color: colors.gray[500], marginTop: 1 },
  priceValue: { fontSize: 14, fontWeight: '700', color: colors.brand[700] },
  priceUnit: { fontSize: 10, color: colors.gray[400] },
})
