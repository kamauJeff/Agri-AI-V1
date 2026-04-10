import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/authStore'
import { colors, spacing, radius, typography } from '@/lib/theme'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  async function handleLogin() {
    if (!phone || !password) return Alert.alert('Error', 'Please fill in all fields')
    setLoading(true)
    try {
      const res = await authApi.login({ phone, password })
      const { user, tokens } = res.data.data
      await setAuth(user, tokens.accessToken, tokens.refreshToken ?? '')
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Alert.alert('Login failed', err.response?.data?.error ?? 'Please check your credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="leaf" size={32} color={colors.white} />
          </View>
          <Text style={s.logoText}>AgriAI Africa</Text>
          <Text style={s.tagline}>Empowering smallholder farmers</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your farm dashboard</Text>

          <View style={s.field}>
            <Text style={s.label}>Phone number</Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={18} color={colors.gray[400]} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="+254712345678"
                placeholderTextColor={colors.gray[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.gray[400]} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={s.btnText}>Sign in</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={s.registerLink}>
            <Text style={s.registerText}>
              Don't have an account? <Text style={s.registerBold}>Register</Text>
            </Text>
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={s.demo}>
            <Text style={s.demoTitle}>Demo account</Text>
            <Text style={s.demoText}>+254712345678 / Farmer@1234</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: { fontSize: 28, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  heading: { fontSize: 24, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  sub: { fontSize: 14, color: colors.gray[500], marginBottom: spacing.xl },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.gray[200],
    borderRadius: radius.md, backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: colors.gray[900] },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.md, height: 50,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  registerLink: { alignItems: 'center', marginTop: spacing.lg },
  registerText: { fontSize: 14, color: colors.gray[500] },
  registerBold: { color: colors.brand[600], fontWeight: '600' },
  demo: {
    marginTop: spacing.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: radius.md, borderStyle: 'dashed',
  },
  demoTitle: { fontSize: 12, fontWeight: '600', color: colors.gray[500], marginBottom: 2 },
  demoText: { fontSize: 12, color: colors.gray[400] },
})
