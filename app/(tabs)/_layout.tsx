import { Tabs } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Text } from 'react-native'

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.green[500],
                tabBarInactiveTintColor: Colors.text.muted,
                tabBarStyle: {
                    backgroundColor: '#f7f5f0',
                    borderTopColor: '#d4e8d0',
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                },
                headerStyle: {
                    backgroundColor: '#f7f5f0',
                },
                headerTintColor: Colors.green[500],
                headerTitleStyle: {
                    fontWeight: '700',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color }) => (
                        <TabIcon emoji="🏠" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="waste"
                options={{
                    title: 'Pesées',
                    tabBarIcon: ({ color }) => (
                        <TabIcon emoji="⚖️" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Calendrier',
                    tabBarIcon: ({ color }) => (
                        <TabIcon emoji="📅" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => (
                        <TabIcon emoji="👤" color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}

// Composant simple pour les icônes emoji
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
    return (
        <Text style={{ fontSize: 20, color }}>{emoji}</Text>
    )
}