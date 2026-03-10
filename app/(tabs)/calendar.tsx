import { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native'
import { pb, Event } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function CalendarScreen() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())

    useEffect(() => {
        loadEvents()
    }, [currentMonth])

    const loadEvents = async () => {
        setLoading(true)
        try {
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().replace('T', ' ').substring(0, 19)
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().replace('T', ' ').substring(0, 19)

            const data = await pb.collection('events').getList(1, 50, {
                filter: `date_debut >= "${firstDay}" && date_debut <= "${lastDay}"`,
                sort: 'date_debut',
            })
            setEvents(data.items as unknown as Event[])
        } catch (error) {
            console.log('Erreur chargement événements:', error)
        } finally {
            setLoading(false)
        }
    }

    const prevMonth = () => {
        setSelectedDay(null)
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setSelectedDay(null)
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

    // Jours du mois
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate()
    const today = new Date()

    const isToday = (day: number) =>
        day === today.getDate() &&
        currentMonth.getMonth() === today.getMonth() &&
        currentMonth.getFullYear() === today.getFullYear()

    const hasEvent = (day: number) =>
        events.some(e => new Date(e.date_debut).getDate() === day)

    const eventsForDay = (day: number) =>
        events.filter(e => new Date(e.date_debut).getDate() === day)

    const displayedEvents = selectedDay
        ? eventsForDay(selectedDay)
        : events

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const formatDateFull = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

    // Grille calendrier
    const calDays = []

    // Jours du mois précédent
    for (let i = offset - 1; i >= 0; i--) {
        calDays.push({ day: prevMonthDays - i, current: false })
    }
    // Jours du mois courant
    for (let d = 1; d <= daysInMonth; d++) {
        calDays.push({ day: d, current: true })
    }
    // Jours du mois suivant
    const remaining = calDays.length % 7 === 0 ? 0 : 7 - (calDays.length % 7)
    for (let i = 1; i <= remaining; i++) {
        calDays.push({ day: i, current: false })
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inner}>

                    {/* Navigation mois */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                            <Text style={styles.navBtnText}>‹</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>{monthLabel}</Text>
                        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                            <Text style={styles.navBtnText}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Jours de la semaine */}
                    <View style={styles.weekDays}>
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                            <Text key={d} style={styles.weekDay}>{d}</Text>
                        ))}
                    </View>

                    {/* Grille des jours */}
                    <View style={styles.calGrid}>
                        {calDays.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.calDay,
                                    !item.current && styles.calDayOther,
                                    item.current && isToday(item.day) && styles.calDayToday,
                                    item.current && selectedDay === item.day && !isToday(item.day) && styles.calDaySelected,
                                ]}
                                onPress={() => {
                                    if (!item.current) return
                                    setSelectedDay(selectedDay === item.day ? null : item.day)
                                }}
                            >
                                <Text style={[
                                    styles.calDayText,
                                    !item.current && styles.calDayTextOther,
                                    isToday(item.day) && item.current && styles.calDayTextToday,
                                ]}>
                                    {item.day}
                                </Text>
                                {item.current && hasEvent(item.day) && (
                                    <View style={[
                                        styles.eventDot,
                                        isToday(item.day) && styles.eventDotToday,
                                    ]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Titre section événements */}
                    <Text style={styles.sectionLabel}>
                        {selectedDay
                            ? `Événements du ${selectedDay} ${currentMonth.toLocaleDateString('fr-FR', { month: 'long' })}`
                            : 'Tous les événements du mois'
                        }
                    </Text>

                    {/* Liste événements */}
                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.green[500]} />
                    ) : displayedEvents.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>
                                {selectedDay ? 'Aucun événement ce jour' : 'Aucun événement ce mois-ci'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.eventsList}>
                            {displayedEvents.map(event => (
                                <View key={event.id} style={styles.eventCard}>
                                    <View style={styles.eventDateBox}>
                                        <Text style={styles.eventDay}>
                                            {new Date(event.date_debut).getDate()}
                                        </Text>
                                        <Text style={styles.eventMonth}>
                                            {new Date(event.date_debut).toLocaleDateString('fr-FR', { month: 'short' })}
                                        </Text>
                                    </View>
                                    <View style={styles.eventBody}>
                                        <Text style={styles.eventTitle}>{event.titre}</Text>
                                        {event.description ? (
                                            <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
                                        ) : null}
                                        <View style={styles.eventMeta}>
                                            <Text style={styles.eventMetaText}>
                                                🕑 {formatTime(event.date_debut)}
                                                {event.date_fin ? ` – ${formatTime(event.date_fin)}` : ''}
                                            </Text>
                                            {event.lieu ? (
                                                <Text style={styles.eventMetaText}>📍 {event.lieu}</Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg.light,
    },
    inner: {
        padding: 20,
        gap: 12,
        paddingBottom: 32,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navBtnText: {
        fontSize: 20,
        color: Colors.green[500],
        fontWeight: '700',
    },
    monthLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        textTransform: 'capitalize',
    },
    weekDays: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    weekDay: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.muted,
        textTransform: 'uppercase',
    },
    calGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    calDay: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        position: 'relative',
    },
    calDayOther: {
        opacity: 0.3,
    },
    calDayToday: {
        backgroundColor: Colors.green[500],
    },
    calDaySelected: {
        backgroundColor: Colors.green[100],
    },
    calDayText: {
        fontSize: 14,
        color: Colors.text.primary,
    },
    calDayTextOther: {
        color: Colors.text.muted,
    },
    calDayTextToday: {
        color: 'white',
        fontWeight: '700',
    },
    eventDot: {
        position: 'absolute',
        bottom: 3,
        width: 5,
        height: 5,
        borderRadius: 99,
        backgroundColor: Colors.green[400],
    },
    eventDotToday: {
        backgroundColor: 'white',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.text.muted,
        marginTop: 8,
    },
    emptyCard: {
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    eventsList: {
        gap: 10,
    },
    eventCard: {
        flexDirection: 'row',
        gap: 14,
        padding: 14,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
    },
    eventDateBox: {
        width: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0faf0',
        borderRadius: 14,
        padding: 8,
    },
    eventDay: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.green[500],
        lineHeight: 24,
    },
    eventMonth: {
        fontSize: 11,
        textTransform: 'uppercase',
        color: Colors.text.muted,
    },
    eventBody: {
        flex: 1,
        gap: 4,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    eventDesc: {
        fontSize: 13,
        color: Colors.text.muted,
        lineHeight: 18,
    },
    eventMeta: {
        gap: 2,
        marginTop: 4,
    },
    eventMetaText: {
        fontSize: 12,
        color: Colors.text.muted,
    },
})