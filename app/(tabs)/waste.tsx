import { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native'
import { pb, WasteEntry } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

const CATEGORIES = [
    { key: 'organique', label: '🥗 Organique', color: '#4caf50' },
    { key: 'recyclable', label: '♻️ Recyclable', color: '#2196f3' },
    { key: 'emballage', label: '📦 Emballage', color: '#ff9800' },
    { key: 'residuel', label: '🗑️ Résiduel', color: '#9e9e9e' },
]

export default function WasteScreen() {
    const [entries, setEntries] = useState<WasteEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [modalVisible, setModalVisible] = useState(false)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string>('')

    // Formulaire
    const [poids, setPoids] = useState('')
    const [categorie, setCategorie] = useState('organique')
    const [note, setNote] = useState('')

    useEffect(() => {
        loadEntries()
    }, [])

    const loadEntries = async () => {
        try {
            const userId = pb.authStore.record?.id
            const profile = await pb.collection('profiles').getFirstListItem(
                `user = "${userId}"`
            )

            setUserId(userId ?? "")

            // Pesées du mois en cours
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const data = await pb.collection('waste_entries').getList(1, 100, {
                filter: `user = "${userId}" && created >= "${firstDay}"`,
                sort: '-created',
            })
            setEntries(data.items as unknown as WasteEntry[])
        } catch (error) {
            console.log('Erreur chargement pesées:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!poids || isNaN(parseFloat(poids))) {
            Alert.alert('Erreur', 'Merci d\'entrer un poids valide')
            return
        }

        setSaving(true)
        try {
            await pb.collection('waste_entries').create({
                user: userId,
                poids: parseFloat(poids),
                categorie,
                note,
            })

            // Reset formulaire
            setPoids('')
            setCategorie('organique')
            setNote('')
            setModalVisible(false)

            // Recharger les entrées
            await loadEntries()

        } catch (error) {
            console.log('Erreur sauvegarde:', error)
            Alert.alert('Erreur', 'Impossible de sauvegarder la pesée')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cette pesée ?')) return
        try {
            await pb.collection('waste_entries').delete(id)
            await loadEntries()
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer cette pesée')
        }
    }

    // Calculs
    const totalMois = entries.reduce((sum, e) => sum + e.poids, 0)
    const totalArrondi = Math.round(totalMois * 10) / 10
    const objectif = 6
    const progression = Math.min((totalArrondi / objectif) * 100, 100)

    const statsByCategorie = CATEGORIES.map(cat => ({
        ...cat,
        total: Math.round(
            entries
                .filter(e => e.categorie === cat.key)
                .reduce((sum, e) => sum + e.poids, 0) * 10
        ) / 10,
    }))

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
        })
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.green[500]} />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inner}>

                    {/* Résumé mensuel */}
                    <View style={styles.summary}>
                        <Text style={styles.summaryLabel}>Total ce mois</Text>
                        <Text style={styles.summaryVal}>{totalArrondi} <Text style={styles.summaryUnit}>kg</Text></Text>
                        <Text style={styles.summaryObjectif}>sur {objectif} kg d'objectif</Text>
                        <View style={styles.progressWrap}>
                            <View style={[styles.progressFill, { width: `${progression}%` }]} />
                        </View>
                        <Text style={styles.summaryTrend}>📉 Objectif mensuel : {objectif} kg</Text>
                    </View>

                    {/* Bouton ajouter */}
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.addBtnText}>＋ Ajouter une pesée</Text>
                    </TouchableOpacity>

                    {/* Par catégorie */}
                    <Text style={styles.sectionLabel}>Par catégorie</Text>
                    <View style={styles.card}>
                        {statsByCategorie.map((cat, index) => (
                            <View key={cat.key}>
                                {index > 0 && <View style={styles.divider} />}
                                <View style={styles.catRow}>
                                    <Text style={styles.catIcon}>{cat.label.split(' ')[0]}</Text>
                                    <View style={styles.catInfo}>
                                        <Text style={styles.catName}>{cat.label.split(' ').slice(1).join(' ')}</Text>
                                        <View style={styles.catBarWrap}>
                                            <View style={[
                                                styles.catBarFill,
                                                {
                                                    width: totalArrondi > 0 ? `${(cat.total / totalArrondi) * 100}%` : '0%',
                                                    backgroundColor: cat.color
                                                }
                                            ]} />
                                        </View>
                                    </View>
                                    <Text style={styles.catVal}>{cat.total} kg</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Historique */}
                    <Text style={styles.sectionLabel}>Historique</Text>
                    {entries.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Aucune pesée ce mois-ci</Text>
                            <Text style={styles.emptySubtext}>Appuyez sur "Ajouter" pour commencer</Text>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            {entries.map((entry, index) => {
                                const cat = CATEGORIES.find(c => c.key === entry.categorie)
                                return (
                                    <View key={entry.id}>
                                        {index > 0 && <View style={styles.divider} />}
                                        <View style={styles.entryRow}>
                                            <View style={[styles.entryDot, { backgroundColor: cat?.color }]} />
                                            <View style={styles.entryInfo}>
                                                <Text style={styles.entryName}>{cat?.label}</Text>
                                                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                                            </View>
                                            <Text style={styles.entryDate}>{formatDate(entry.created)}</Text>
                                            <Text style={styles.entryKg}>{entry.poids} kg</Text>
                                            <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                                                <Text style={styles.deleteBtn}>🗑️</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Modal ajout pesée */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity style={styles.modal} activeOpacity={1}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Nouvelle pesée ⚖️</Text>

                        {/* Poids */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Poids (kg) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ex: 0.5"
                                placeholderTextColor={Colors.text.muted}
                                value={poids}
                                onChangeText={setPoids}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Catégorie */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Catégorie</Text>
                            <View style={styles.chips}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[
                                            styles.chip,
                                            categorie === cat.key && { backgroundColor: cat.color, borderColor: cat.color }
                                        ]}
                                        onPress={() => setCategorie(cat.key)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            categorie === cat.key && { color: 'white' }
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Note */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Note (optionnel)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ex: après le marché"
                                placeholderTextColor={Colors.text.muted}
                                value={note}
                                onChangeText={setNote}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveBtnText}>Enregistrer la pesée</Text>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
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
    summary: {
        backgroundColor: Colors.green[600],
        borderRadius: 24,
        padding: 24,
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    summaryVal: {
        fontSize: 48,
        fontWeight: '700',
        color: 'white',
        lineHeight: 52,
    },
    summaryUnit: {
        fontSize: 20,
    },
    summaryObjectif: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    progressWrap: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 99,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'white',
        borderRadius: 99,
    },
    summaryTrend: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
    },
    addBtn: {
        backgroundColor: Colors.green[500],
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    addBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.text.muted,
        marginTop: 8,
    },
    card: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0faf0',
        marginVertical: 10,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    catIcon: {
        fontSize: 22,
        width: 32,
        textAlign: 'center',
    },
    catInfo: {
        flex: 1,
        gap: 4,
    },
    catName: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    catBarWrap: {
        height: 4,
        backgroundColor: '#f0faf0',
        borderRadius: 99,
        overflow: 'hidden',
    },
    catBarFill: {
        height: '100%',
        borderRadius: 99,
    },
    catVal: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.green[500],
    },
    emptyCard: {
        backgroundColor: '#f0faf0',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    emptySubtext: {
        fontSize: 13,
        color: Colors.text.muted,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    entryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    entryInfo: {
        flex: 1,
    },
    entryName: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    entryNote: {
        fontSize: 12,
        color: Colors.text.muted,
    },
    entryDate: {
        fontSize: 12,
        color: Colors.text.muted,
    },
    entryKg: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    deleteBtn: {
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
        gap: 16,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#d4e8d0',
        borderRadius: 99,
        alignSelf: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    input: {
        backgroundColor: '#f0faf0',
        borderWidth: 1.5,
        borderColor: '#d4e8d0',
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        color: Colors.text.primary,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: '#d4e8d0',
        backgroundColor: '#f0faf0',
    },
    chipText: {
        fontSize: 13,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    saveBtn: {
        backgroundColor: Colors.green[500],
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
})