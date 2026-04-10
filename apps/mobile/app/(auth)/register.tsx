import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { colors, spacing, radius } from '@/lib/theme'
import { KENYA_COUNTIES } from '@agriai/shared'

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'FARMER' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const pwRules = [
    { ok: form.password.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(form.password), label: 'Uppercase letter' },
    { ok: /[0-9]/.test(form.password), label: 'Number' },
  ]

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password) return Alert.alert('Error', 'Please fill in all required fields')
    if (pwRules.some(r => !r.ok)) return Alert.alert('Weak password', 'Please meet all password requirements')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      const { user, tokens } = res.data.data
      await setAuth(user, tokens.accessToken, tokens.refreshToken ?? '')
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.details
      const msg = detail ? Object.values(detail).flat().join('\n') : err.response?.data?.error ?? 'Registration failed'
      Alert.alert('Registration failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
      </TouchableOpacity>

      <View style={s.logoWrap}>
        <View style={s.logoCircle}>
          <Ionicons name="leaf" size={26} color={colors.white} />
        </View>
        <Text style={s.heading}>Create account</Text>
        <Text style={s.sub}>Start managing your farm smarter</Text>
      </View>

      {/* Name */}
      <View style={s.field}>
        <Text style={s.label}>Full name *</Text>
        <TextInput style={s.input} placeholder="John Kamau" placeholderTextColor={colors.gray[400]}
          value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      </View>

      {/* Phone */}
      <View style={s.field}>
        <Text style={s.label}>Phone number *</Text>
        <TextInput style={s.input} placeholder="+254712345678" placeholderTextColor={colors.gray[400]}
          value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad" autoCapitalize="none" />
      </View>

      {/* Email */}
      <View style={s.field}>
        <Text style={s.label}>Email (optional)</Text>
        <TextInput style={s.input} placeholder="john@example.com" placeholderTextColor={colors.gray[400]}
          value={form.email} onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address" autoCapitalize="none" />
      </View>

      {/* Role */}
      <View style={s.field}>
        <Text style={s.label}>I am a</Text>
        <View style={s.roleRow}>
          {['FARMER', 'AGENT'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[s.roleBtn, form.role === role && s.roleBtnActive]}
              onPress={() => setForm({ ...form, role })}
            >
              <Text style={[s.roleBtnText, form.role === role && s.roleBtnTextActive]}>
                {role === 'FARMER' ? '🌾 Farmer' : '👤 Agent'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Password */}
      <View style={s.field}>
        <Text style={s.label}>Password *</Text>
        <View style={s.pwWrap}>
          <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]}
            placeholder="••••••••" placeholderTextColor={colors.gray[400]}
            value={form.password} onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry={!showPw} />
          <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 8 }}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>
        {form.password.length > 0 && (
          <View style={s.pwRules}>
            {pwRules.map((r) => (
              <View key={r.label} style={s.pwRule}>
                <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={14}
                  color={r.ok ? colors.brand[600] : colors.gray[400]} />
                <Text style={[s.pwRuleText, r.ok && { color: colors.brand[700] }]}>{r.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
        {loading
          ? <ActivityIndicator color={colors.white} />
          : <Text style={s.btnText}>Create account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Text style={{ fontSize: 14, color: colors.gray[500] }}>
          Already have an account? <Text style={{ color: colors.brand[600], fontWeight: '600' }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: spacing.xl, paddingTop: 60 },
  back: { marginBottom: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand[600],
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  heading: { fontSize: 24, fontWeight: '700', color: colors.gray[900] },
  sub: { fontSize: 14, color: colors.gray[500], marginTop: 4 },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.md,
    height: 48, paddingHorizontal: spacing.md, fontSize: 15, color: colors.gray[900],
    backgroundColor: colors.white,
  },
  pwWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.gray[200],
    borderRadius: radius.md, backgroundColor: colors.white,
    paddingLeft: spacing.md,
  },
  pwRules: { marginTop: 8, gap: 4 },
  pwRule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwRuleText: { fontSize: 12, color: colors.gray[400] },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.gray[200],
    borderRadius: radius.md, paddingVertical: 12, alignItems: 'center',
    backgroundColor: colors.white,
  },
  roleBtnActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  roleBtnText: { fontSize: 14, color: colors.gray[600], fontWeight: '500' },
  roleBtnTextActive: { color: colors.brand[700], fontWeight: '600' },
  btn: {
    backgroundColor: colors.brand[600], borderRadius: radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.white },
})
