import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

const TABS: { name: string; title: string; icon: IconName; activeIcon: IconName }[] = [
  { name: 'dashboard', title: 'Home',    icon: 'home-outline',         activeIcon: 'home' },
  { name: 'weather',   title: 'Weather', icon: 'cloud-outline',        activeIcon: 'cloud' },
  { name: 'market',    title: 'Market',  icon: 'storefront-outline',   activeIcon: 'storefront' },
  { name: 'credit',    title: 'Credit',  icon: 'card-outline',         activeIcon: 'card' },
  { name: 'loans',     title: 'Loans',   icon: 'cash-outline',         activeIcon: 'cash' },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {TABS.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
