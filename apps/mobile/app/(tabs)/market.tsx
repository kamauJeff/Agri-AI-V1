import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useMarketPrices } from '@/hooks/useApi'
import { colors, spacing, radius, shadows } from '@/lib/theme'
import { formatKes, formatDate } from '@/lib/utils'

export default function MarketScreen() {
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useMarketPrices({
    crop: search || undefined,
    county: county || undefined,
    page,
    pageSize: 20,
  })

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  function PriceItem({ item }: { item: any }) {
    return (
      <View style={[s.item, shadows.sm]}>
        <View style={{ flex: 1 }}>
          <Text style={s.crop}>{item.crop}</Text>
          <Text style={s.county}>{item.county} · {item.region}</Text>
          <Text style={s.date}>{formatDate(item.recordedAt)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.price}>{formatKes(item.priceKes)}</Text>
          <Text style={s.unit}>per {item.unit === 'KG' ? 'kg' : item.unit.replace('_', ' ').toLowerCase()}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Market Prices</Text>
        <Text style={s.sub}>Live crop prices across Kenya</Text>

        {/* Search */}
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={colors.gray[400]} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search crop…"
            placeholderTextColor={colors.gray[400]}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1) }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={s.countyInput}
          placeholder="Filter by county…"
          placeholderTextColor={colors.gray[400]}
          value={county}
          onChangeText={(v) => { setCounty(v); setPage(1) }}
        />
      </View>

      {/* List */}
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PriceItem item={item} />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[600]} />}
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
            : <View style={s.empty}><Text style={s.emptyText}>No prices found</Text></View>
        }
        ListFooterComponent={
          data && data.totalPages > 1 ? (
            <View style={s.pagination}>
              <TouchableOpacity
                style={[s.pageBtn, page === 1 && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={16} color={page === 1 ? colors.gray[300] : colors.brand[600]} />
              </TouchableOpacity>
              <Text style={s.pageText}>Page {data.page} of {data.totalPages}</Text>
              <TouchableOpacity
                style={[s.pageBtn, page === data.totalPages && s.pageBtnDisabled]}
                onPress={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                <Ionicons name="chevron-forward" size={16} color={page === data.totalPages ? colors.gray[300] : colors.brand[600]} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    backgroundColor: colors.brand[800], paddingTop: 56,
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xl,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: spacing.lg },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 44, marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.gray[900] },
  countyInput: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md,
    paddingHorizontal: spacing.md, height: 40, fontSize: 14, color: colors.white,
  },
  list: { padding: spacing.lg },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  crop: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  county: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  date: { fontSize: 11, color: colors.gray[400], marginTop: 1 },
  price: { fontSize: 16, fontWeight: '700', color: colors.brand[700] },
  unit: { fontSize: 10, color: colors.gray[400], marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: colors.gray[400] },
  pagination: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.lg,
  },
  pageBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.gray[200],
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: 13, color: colors.gray[600] },
})
