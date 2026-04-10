import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFarms, useWeatherForecast, useWeatherAlerts } from '@/hooks/useApi'
import { colors, spacing, radius, shadows } from '@/lib/theme'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function WeatherIcon({ icon, size = 24, color = colors.white }: { icon: string; size?: number; color?: string }) {
  if (icon.includes('01')) return <Ionicons name="sunny" size={size} color="#fbbf24" />
  if (icon.includes('02') || icon.includes('03')) return <Ionicons name="partly-sunny" size={size} color="#fbbf24" />
  if (icon.includes('09') || icon.includes('10')) return <Ionicons name="rainy" size={size} color="#60a5fa" />
  if (icon.includes('11')) return <Ionicons name="thunderstorm" size={size} color="#a78bfa" />
  if (icon.includes('13')) return <Ionicons name="snow" size={size} color="#bfdbfe" />
  return <Ionicons name="cloudy" size={size} color={color} />
}

function AlertBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; text: string; icon: string }> = {
    HIGH:   { bg: '#fee2e2', text: '#991b1b', icon: 'alert-circle' },
    MEDIUM: { bg: '#fef3c7', text: '#92400e', icon: 'warning' },
    LOW:    { bg: '#dbeafe', text: '#1e40af', icon: 'information-circle' },
  }
  const style = map[severity] ?? map.LOW
  return (
    <View style={[ab.badge, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon as any} size={12} color={style.text} />
      <Text style={[ab.text, { color: style.text }]}>{severity}</Text>
    </View>
  )
}
const ab = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
})

function FarmWeather({ farm }: { farm: any }) {
  const { data, isLoading } = useWeatherForecast(farm.id)
  const { data: alerts } = useWeatherAlerts(farm.id)
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={[fw.card, shadows.sm]}>
      {/* Farm header */}
      <TouchableOpacity style={fw.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={fw.farmIcon}>
          <Ionicons name="location" size={18} color={colors.brand[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fw.farmName}>{farm.name}</Text>
          <Text style={fw.farmSub}>{farm.county} · {farm.latitude.toFixed(2)}°, {farm.longitude.toFixed(2)}°</Text>
        </View>
        {alerts && alerts.length > 0 && (
          <View style={fw.alertCount}>
            <Text style={fw.alertCountText}>{alerts.length}</Text>
          </View>
        )}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.gray[400]} />
      </TouchableOpacity>

      {/* Current conditions inline preview */}
      {!expanded && data?.current && (
        <View style={fw.preview}>
          <WeatherIcon icon={data.current.icon} size={28} />
          <Text style={fw.previewTemp}>{data.current.temp}°C</Text>
          <Text style={fw.previewDesc}>{data.current.description}</Text>
          <View style={fw.previewStats}>
            <Ionicons name="water-outline" size={12} color={colors.gray[400]} />
            <Text style={fw.previewStat}>{data.current.humidity}%</Text>
            <Ionicons name="speedometer-outline" size={12} color={colors.gray[400]} />
            <Text style={fw.previewStat}>{data.current.windSpeed}m/s</Text>
          </View>
        </View>
      )}

      {isLoading && !expanded && (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.brand[600]} />
        </View>
      )}

      {/* Expanded: full forecast + alerts */}
      {expanded && (
        <View style={fw.expanded}>
          {isLoading && <ActivityIndicator color={colors.brand[600]} style={{ margin: spacing.xl }} />}

          {data?.current && (
            <LinearGradient colors={['#166534', '#15803d']} style={fw.currentCard}>
              <View style={fw.currentTop}>
                <View>
                  <Text style={fw.currentTemp}>{data.current.temp}°C</Text>
                  <Text style={fw.currentDesc}>{data.current.description}</Text>
                  <Text style={fw.currentFeels}>Feels like {data.current.feelsLike}°C</Text>
                </View>
                <WeatherIcon icon={data.current.icon} size={64} />
              </View>
              <View style={fw.currentStats}>
                <View style={fw.currentStat}>
                  <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={fw.currentStatText}>{data.current.humidity}% humidity</Text>
                </View>
                <View style={fw.currentStat}>
                  <Ionicons name="speedometer-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={fw.currentStatText}>{data.current.windSpeed} m/s wind</Text>
                </View>
                <View style={fw.currentStat}>
                  <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={fw.currentStatText}>{((data.current.visibility ?? 10000) / 1000).toFixed(0)}km vis.</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {/* 7-day forecast */}
          {data?.forecast && (
            <View style={fw.forecastSection}>
              <Text style={fw.sectionTitle}>7-Day Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={fw.forecastRow}>
                  {data.forecast.slice(0, 7).map((day: any) => {
                    const d = new Date(day.date)
                    return (
                      <View key={day.date} style={fw.dayCard}>
                        <Text style={fw.dayLabel}>{DAY_LABELS[d.getDay()]}</Text>
                        <WeatherIcon icon={day.icon} size={22} color={colors.gray[600]} />
                        <Text style={fw.dayMax}>{day.tempMax}°</Text>
                        <Text style={fw.dayMin}>{day.tempMin}°</Text>
                        {day.rainfall > 0 && (
                          <View style={fw.rainBadge}>
                            <Ionicons name="rainy" size={9} color="#3b82f6" />
                            <Text style={fw.rainText}>{day.rainfall}mm</Text>
                          </View>
                        )}
                        <View style={fw.humidRow}>
                          <Ionicons name="water-outline" size={9} color={colors.gray[400]} />
                          <Text style={fw.humidText}>{day.humidity}%</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <View style={fw.alertsSection}>
              <Text style={fw.sectionTitle}>Active Alerts</Text>
              {alerts.map((alert: any) => (
                <View key={alert.id} style={[fw.alertCard, {
                  backgroundColor: alert.severity === 'HIGH' ? '#fee2e2' : alert.severity === 'MEDIUM' ? '#fef3c7' : '#dbeafe',
                  borderLeftColor: alert.severity === 'HIGH' ? '#dc2626' : alert.severity === 'MEDIUM' ? '#d97706' : '#2563eb',
                }]}>
                  <View style={fw.alertHeader}>
                    <Text style={fw.alertType}>{alert.type.replace(/_/g, ' ')}</Text>
                    <AlertBadge severity={alert.severity} />
                  </View>
                  <Text style={fw.alertMessage}>{alert.message}</Text>
                </View>
              ))}
            </View>
          )}

          {alerts && alerts.length === 0 && data && (
            <View style={fw.noAlerts}>
              <Ionicons name="checkmark-circle" size={20} color={colors.brand[600]} />
              <Text style={fw.noAlertsText}>No active weather alerts</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const fw = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  farmIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  farmName: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  farmSub: { fontSize: 11, color: colors.gray[500], marginTop: 1 },
  alertCount: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  alertCountText: { fontSize: 11, fontWeight: '700', color: colors.white },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  previewTemp: { fontSize: 22, fontWeight: '700', color: colors.gray[900] },
  previewDesc: { flex: 1, fontSize: 12, color: colors.gray[500], textTransform: 'capitalize' },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewStat: { fontSize: 11, color: colors.gray[400], marginRight: 6 },
  expanded: {},
  currentCard: { margin: spacing.md, borderRadius: radius.lg, padding: spacing.xl },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  currentTemp: { fontSize: 52, fontWeight: '800', color: colors.white },
  currentDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize', marginTop: 2 },
  currentFeels: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  currentStats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg, flexWrap: 'wrap' },
  currentStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currentStatText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  forecastSection: { padding: spacing.lg },
  forecastRow: { flexDirection: 'row', gap: spacing.sm },
  dayCard: {
    alignItems: 'center', backgroundColor: colors.gray[50],
    borderRadius: radius.md, padding: spacing.md, minWidth: 72, gap: 4,
  },
  dayLabel: { fontSize: 11, fontWeight: '700', color: colors.gray[500] },
  dayMax: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  dayMin: { fontSize: 12, color: colors.gray[400] },
  rainBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rainText: { fontSize: 9, color: '#3b82f6', fontWeight: '600' },
  humidRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  humidText: { fontSize: 9, color: colors.gray[400] },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.gray[700], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  alertsSection: { padding: spacing.lg, paddingTop: 0 },
  alertCard: { borderLeftWidth: 3, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  alertType: { fontSize: 12, fontWeight: '700', color: colors.gray[800], textTransform: 'uppercase', letterSpacing: 0.3 },
  alertMessage: { fontSize: 12, color: colors.gray[700], lineHeight: 17 },
  noAlerts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: spacing.lg },
  noAlertsText: { fontSize: 13, color: colors.brand[700], fontWeight: '500' },
})

export default function WeatherScreen() {
  const { data: farms, isLoading: farmsLoading, refetch } = useFarms()
  const [refreshing, setRefreshing] = useState(false)

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['#1e3a5f', '#1d4ed8']} style={s.header}>
        <Text style={s.title}>Weather</Text>
        <Text style={s.sub}>Hyperlocal forecasts for your farms</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[600]} />}
      >
        {farmsLoading && (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={colors.brand[600]} />
            <Text style={s.loadingText}>Loading farms…</Text>
          </View>
        )}

        {!farmsLoading && (!farms || farms.length === 0) && (
          <View style={s.empty}>
            <Ionicons name="cloud-outline" size={64} color={colors.gray[300]} />
            <Text style={s.emptyTitle}>No farms found</Text>
            <Text style={s.emptySub}>Add a farm to see its weather forecast</Text>
          </View>
        )}

        {farms?.map((farm: any) => <FarmWeather key={farm.id} farm={farm} />)}

        {farms && farms.length > 0 && (
          <Text style={s.attribution}>Weather data from OpenWeatherMap · Pull to refresh</Text>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  loading: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  loadingText: { fontSize: 14, color: colors.gray[400] },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[500], marginTop: spacing.lg },
  emptySub: { fontSize: 13, color: colors.gray[400], marginTop: 4, textAlign: 'center' },
  attribution: { fontSize: 11, color: colors.gray[400], textAlign: 'center', marginTop: spacing.md },
})
