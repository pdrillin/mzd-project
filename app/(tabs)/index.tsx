import { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { pb, Profile, Event } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function HomeScreen() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [events, setEvents] = useState<Event[]>([])
    const [totalWaste, setTotalWaste] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const userId = pb.authStore.model?.id

            // Charger le profil
            const profileData = await pb.collection('profiles').getFirstListItem(
                `user = "${userId}"`
            )
            setProfile(profileData as unknown as Profile)

            // Charger les prochains événements
            const eventsData = await pb.collection('events').getList(1, 3, {
                sort: 'date_debut',
                filter: `date_debut >= "${new Date().toISOString()}"`,
            })
            setEvents(eventsData.items as unknown as Event[])

            // Charger le total des pesées du mois
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const wasteData = await pb.collection('waste_entries').getList(1, 100, {
                filter: `user = "${userId}" && created >= "${firstDay}"`,
            })
            const total = wasteData.items.reduce((sum: number, item: any) => sum + item.poids, 0)
            setTotalWaste(Math.round(total * 10) / 10)

        } catch (error) {
            console.log('Erreur chargement:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }
    }

    const objectifKg = 6
    const progression = Math.min((totalWaste / objectifKg) * 100, 100)

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.green[500]} />
            </View>
        )
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.inner}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Bonjour,</Text>
                        <Text style={styles.name}>{profile?.prenom} 👋</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>🌱</Text>
                    </View>
                </View>

                {/* Actions rapides */}
                <Text style={styles.sectionLabel}>Actions rapides</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => router.push('/(tabs)/waste')}
                    >
                        <Text style={styles.quickIcon}>⚖️</Text>
                        <Text style={styles.quickLabel}>Peser mes{'\n'}déchets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => router.push('/(tabs)/calendar')}
                    >
                        <Text style={styles.quickIcon}>📅</Text>
                        <Text style={styles.quickLabel}>Voir les{'\n'}événements</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickBtn}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Text style={styles.quickIcon}>👤</Text>
                        <Text style={styles.quickLabel}>Mon{'\n'}profil</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats du mois */}
                <Text style={styles.sectionLabel}>Ce mois-ci</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statVal}>{totalWaste}</Text>
                        <Text style={styles.statUnit}>kg</Text>
                        <Text style={styles.statLabel}>Déchets pesés</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statVal}>{events.length}</Text>
                        <Text style={styles.statUnit}>événements</Text>
                        <Text style={styles.statLabel}>À venir</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardFull]}>
                        <Text style={styles.statLabel}>Objectif mensuel — {objectifKg} kg</Text>
                        <View style={styles.progressWrap}>
                            <View style={[styles.progressFill, { width: `${progression}%` }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>{totalWaste} kg atteints</Text>
                            <Text style={styles.progressPct}>{Math.round(progression)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Prochains événements */}
                <Text style={styles.sectionLabel}>Prochains événements</Text>
                {events.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>Aucun événement à venir</Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {events.map((event, index) => {
                            const d = formatDate(event.date_debut)
                            return (
                                <View key={event.id}>
                                    {index > 0 && <View style={styles.divider} />}
                                    <View style={styles.eventRow}>
                                        <View style={styles.eventDateBox}>
                                            <Text style={styles.eventDay}>{d.day}</Text>
                                            <Text style={styles.eventMonth}>{d.month}</Text>
                                        </View>
                                        <View style={styles.eventInfo}>
                                            <Text style={styles.eventTitle}>{event.titre}</Text>
                                            <Text style={styles.eventMeta}>📍 {event.lieu} · {d.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                )}

            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg.light,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.bg.light,
    },
    inner: {
        padding: 20,
        gap: 12,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    greeting: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.green[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 22,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.text.muted,
        marginTop: 8,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 10,
    },
    quickBtn: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
        padding: 14,
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
    },
    quickIcon: {
        fontSize: 24,
    },
    quickLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
    },
    statCardFull: {
        flexBasis: '100%',
    },
    statVal: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.green[500],
        lineHeight: 36,
    },
    statUnit: {
        fontSize: 12,
        color: Colors.text.muted,
        marginTop: 2,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 6,
    },
    progressWrap: {
        height: 8,
        backgroundColor: '#d4e8d0',
        borderRadius: 99,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.green[400],
        borderRadius: 99,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    progressText: {
        fontSize: 12,
        color: Colors.text.muted,
    },
    progressPct: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.green[500],
    },
    card: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
    },
    emptyCard: {
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    divider: {
        height: 1,
        backgroundColor: '#d4e8d0',
        marginVertical: 10,
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    eventDateBox: {
        width: 44,
        height: 44,
        backgroundColor: '#f0faf0',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventDay: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.green[500],
        lineHeight: 18,
    },
    eventMonth: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: Colors.text.muted,
    },
    eventInfo: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    eventMeta: {
        fontSize: 12,
        color: Colors.text.muted,
        marginTop: 2,
    },
})