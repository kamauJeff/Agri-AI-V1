import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useLoans, useApplyLoan, useCreditScore } from '@/hooks/useApi'
import { colors, spacing, radius, shadows } from '@/lib/theme'
import { formatKes, formatDate, getLoanStatusColor } from '@/lib/utils'

const PURPOSES = ['SEEDS', 'FERTILIZER', 'PESTICIDES', 'EQUIPMENT', 'IRRIGATION', 'LABOR', 'OTHER']

function LoanCard({ loan }: { loan: any }) {
  const [expanded, setExpanded] = useState(false)
  const sc = getLoanStatusColor(loan.status)
  const paid = loan.repaymentSchedules?.filter((s: any) => s.paidAt).length ?? 0
  const total = loan.repaymentSchedules?.length ?? 0

  return (
    <View style={[lc.card, shadows.sm]}>
      <TouchableOpacity style={lc.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={lc.iconWrap}>
          <Ionicons name="cash" size={20} color={colors.amber[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={lc.topRow}>
            <Text style={lc.amount}>{formatKes(loan.amountKes)}</Text>
            <View style={[lc.badge, { backgroundColor: sc.bg }]}>
              <Text style={[lc.badgeText, { color: sc.text }]}>{loan.status}</Text>
            </View>
          </View>
          <Text style={lc.details}>{loan.purpose.replace('_', ' ')} · {loan.termMonths} months · {loan.interestRatePct}% p.a.</Text>
          {total > 0 && (
            <View style={lc.progress}>
              <View style={lc.progressTrack}>
                <View style={[lc.progressFill, { width: `${(paid / total) * 100}%` as any }]} />
              </View>
              <Text style={lc.progressText}>{paid}/{total} instalments paid</Text>
            </View>
          )}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray[400]} />
      </TouchableOpacity>

      {expanded && loan.repaymentSchedules?.length > 0 && (
        <View style={lc.schedules}>
          <Text style={lc.schedTitle}>Repayment schedule</Text>
          {loan.repaymentSchedules.map((sch: any, i: number) => (
            <View key={sch.id} style={lc.schRow}>
              <Ionicons
                name={sch.paidAt ? 'checkmark-circle' : 'time-outline'}
                size={16}
                color={sch.paidAt ? colors.brand[600] : colors.gray[400]}
              />
              <View style={{ flex: 1 }}>
                <Text style={lc.schNum}>Instalment {i + 1}</Text>
                <Text style={lc.schDate}>Due {formatDate(sch.dueDate)}</Text>
              </View>
              <Text style={[lc.schAmount, sch.paidAt && { color: colors.gray[400] }]}>{formatKes(sch.totalKes)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const lc = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, gap: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.amber[100], alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 3 },
  amount: { fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  details: { fontSize: 12, color: colors.gray[500] },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressTrack: { flex: 1, height: 4, backgroundColor: colors.gray[100], borderRadius: radius.full },
  progressFill: { height: '100%', backgroundColor: colors.brand[500], borderRadius: radius.full },
  progressText: { fontSize: 10, color: colors.gray[400] },
  schedules: { borderTopWidth: 1, borderTopColor: colors.gray[100], padding: spacing.lg },
  schedTitle: { fontSize: 12, fontWeight: '600', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md },
  schRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  schNum: { fontSize: 13, fontWeight: '600', color: colors.gray[800] },
  schDate: { fontSize: 11, color: colors.gray[500] },
  schAmount: { fontSize: 13, fontWeight: '700', color: colors.brand[700] },
})

export default function LoansScreen() {
  const { data: loans, isLoading, refetch } = useLoans()
  const { data: creditScore } = useCreditScore()
  const apply = useApplyLoan()
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amountKes: '', purpose: 'SEEDS', termMonths: '12', purposeDetails: '' })
  const [error, setError] = useState('')

  const activeLoans = loans?.filter((l: any) => ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'].includes(l.status)) ?? []
  const rate = { POOR: 18, FAIR: 15, GOOD: 12, VERY_GOOD: 10, EXCELLENT: 8 }[creditScore?.rating ?? ''] ?? 15
  const amount = Number(form.amountKes) || 0
  const months = Number(form.termMonths) || 12
  const mr = rate / 100 / 12
  const emi = mr === 0 ? amount / months : (amount * mr * Math.pow(1 + mr, months)) / (Math.pow(1 + mr, months) - 1)

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false) }

  async function handleApply() {
    setError('')
    if (!form.amountKes) return setError('Please enter a loan amount')
    try {
      await apply.mutateAsync({ amountKes: Number(form.amountKes), purpose: form.purpose as any, termMonths: Number(form.termMonths), purposeDetails: form.purposeDetails || undefined })
      setShowForm(false)
      setForm({ amountKes: '', purpose: 'SEEDS', termMonths: '12', purposeDetails: '' })
      Alert.alert('Success', 'Loan application submitted successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Application failed')
    }
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[600]} />}
    >
      <View style={s.header}>
        <Text style={s.title}>Loans</Text>
        <Text style={s.sub}>Farm credit and repayment tracking</Text>
        {creditScore && (
          <View style={s.limitBadge}>
            <Text style={s.limitText}>Your limit: {formatKes(creditScore.maxLoanAmountKes)} · {rate}% p.a.</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        {/* Apply button */}
        {!showForm && activeLoans.length === 0 && creditScore && (
          <TouchableOpacity style={[s.applyBtn, shadows.sm]} onPress={() => setShowForm(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={22} color={colors.white} />
            <Text style={s.applyBtnText}>Apply for a loan</Text>
          </TouchableOpacity>
        )}

        {activeLoans.length > 0 && (
          <View style={s.activeLoanWarning}>
            <Ionicons name="information-circle" size={18} color={colors.amber[700]} />
            <Text style={s.activeLoanText}>You have an active loan. Repay it before applying for a new one.</Text>
          </View>
        )}

        {/* Apply form */}
        {showForm && (
          <View style={[s.form, shadows.sm]}>
            <Text style={s.formTitle}>Loan application</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}

            <Text style={s.label}>Amount (KES)</Text>
            <TextInput style={s.input} placeholder={`Max: ${formatKes(creditScore?.maxLoanAmountKes ?? 0)}`}
              placeholderTextColor={colors.gray[400]} keyboardType="numeric"
              value={form.amountKes} onChangeText={(v) => setForm({ ...form, amountKes: v })} />

            <Text style={s.label}>Term</Text>
            <View style={s.chipRow}>
              {[3, 6, 12, 18, 24, 36].map(m => (
                <TouchableOpacity key={m} style={[s.chip, form.termMonths === String(m) && s.chipActive]}
                  onPress={() => setForm({ ...form, termMonths: String(m) })}>
                  <Text style={[s.chipText, form.termMonths === String(m) && s.chipTextActive]}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Purpose</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PURPOSES.map(p => (
                  <TouchableOpacity key={p} style={[s.chip, form.purpose === p && s.chipActive]}
                    onPress={() => setForm({ ...form, purpose: p })}>
                    <Text style={[s.chipText, form.purpose === p && s.chipTextActive]}>{p.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {amount > 0 && (
              <View style={s.preview}>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Monthly payment</Text>
                  <Text style={s.previewValue}>{formatKes(Math.round(emi))}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Total repayment</Text>
                  <Text style={s.previewValue}>{formatKes(Math.round(emi * months))}</Text>
                </View>
                <View style={s.previewRow}>
                  <Text style={s.previewLabel}>Interest rate</Text>
                  <Text style={s.previewValue}>{rate}% p.a.</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, apply.isPending && { opacity: 0.6 }]}
                onPress={handleApply} disabled={apply.isPending}>
                {apply.isPending ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={s.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loans list */}
        <Text style={s.sectionTitle}>Your loans</Text>
        {isLoading && <ActivityIndicator color={colors.brand[600]} />}
        {!isLoading && loans?.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="cash-outline" size={48} color={colors.gray[300]} />
            <Text style={s.emptyText}>No loans yet</Text>
          </View>
        )}
        {loans?.map((loan: any) => <LoanCard key={loan.id} loan={loan} />)}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { backgroundColor: colors.amber[700], paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  limitBadge: { marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 4 },
  limitText: { fontSize: 12, color: colors.white, fontWeight: '600' },
  body: { padding: spacing.xl },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brand[600], borderRadius: radius.lg, paddingVertical: 16, marginBottom: spacing.xl },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  activeLoanWarning: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.amber[100], borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.xl },
  activeLoanText: { flex: 1, fontSize: 13, color: colors.amber[800] },
  form: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl },
  formTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg },
  error: { color: '#dc2626', fontSize: 13, marginBottom: spacing.md, backgroundColor: '#fee2e2', padding: spacing.md, borderRadius: radius.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, height: 48, paddingHorizontal: spacing.md, fontSize: 15, color: colors.gray[900], marginBottom: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.white },
  chipActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  chipText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  chipTextActive: { color: colors.brand[700], fontWeight: '700' },
  preview: { backgroundColor: colors.brand[50], borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  previewLabel: { fontSize: 13, color: colors.gray[600] },
  previewValue: { fontSize: 13, fontWeight: '700', color: colors.brand[700] },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.gray[600] },
  submitBtn: { flex: 2, backgroundColor: colors.brand[600], borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: 14, fontWeight: '700', color: colors.white },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: colors.gray[400], marginTop: spacing.md },
})
