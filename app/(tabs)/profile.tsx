import { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { pb, Profile } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function ProfileScreen() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [totalPesees, setTotalPesees] = useState(0)
    const [totalKg, setTotalKg] = useState(0)
    const [changingPassword, setChangingPassword] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    // Formulaire édition
    const [form, setForm] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        ville: '',
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const userId = pb.authStore.model?.id

            const profileData = await pb.collection('profiles').getFirstListItem(
                `user = "${userId}"`
            )
            setProfile(profileData as unknown as Profile)
            setForm({
                nom: profileData.nom,
                prenom: profileData.prenom,
                telephone: profileData.telephone || '',
                ville: profileData.ville || '',
            })

            // Stats pesées
            const wasteData = await pb.collection('waste_entries').getList(1, 500, {
                filter: `user = "${userId}"`,
            })
            setTotalPesees(wasteData.totalItems)
            const kg = wasteData.items.reduce((sum: number, item: any) => sum + item.poids, 0)
            setTotalKg(Math.round(kg * 10) / 10)

        } catch (error) {
            console.log('Erreur chargement profil:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!form.nom || !form.prenom) {
            Alert.alert('Erreur', 'Le nom et prénom sont obligatoires')
            return
        }

        setSaving(true)
        try {
            await pb.collection('profiles').update(profile!.id, {
                nom: form.nom,
                prenom: form.prenom,
                telephone: form.telephone,
                ville: form.ville,
            })
            await loadProfile()
            setEditing(false)
        } catch (error) {
            console.log('Erreur sauvegarde:', error)
            Alert.alert('Erreur', 'Impossible de sauvegarder les modifications')
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
            pb.authStore.clear()
            router.replace('/(auth)/login')
        }
    }

    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            Alert.alert('Erreur', 'Merci de remplir tous les champs')
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
            return
        }

        if (passwordForm.newPassword.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères')
            return
        }

        setSaving(true)
        try {
            await pb.collection('users').update(pb.authStore.model!.id, {
                oldPassword: passwordForm.oldPassword,
                password: passwordForm.newPassword,
                passwordConfirm: passwordForm.confirmPassword,
            })

            // PocketBase déconnecte après changement de mot de passe
            pb.authStore.clear()
            Alert.alert(
                'Mot de passe modifié',
                'Votre mot de passe a été changé. Veuillez vous reconnecter.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            )
        } catch (error: any) {
            console.log('Erreur password:', JSON.stringify(error?.data))
            Alert.alert('Erreur', 'Ancien mot de passe incorrect')
        } finally {
            setSaving(false)
        }
    }

    const getStatutLabel = () => {
        switch (profile?.statut) {
            case 'accepte': return { label: '✅ Membre actif', color: Colors.green[500] }
            case 'en_attente': return { label: '⏳ En attente', color: '#f59e0b' }
            case 'refuse': return { label: '❌ Refusé', color: '#dc2626' }
            default: return { label: '—', color: Colors.text.muted }
        }
    }

    const statut = getStatutLabel()

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

                {/* Avatar + nom */}
                <View style={styles.hero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>🌿</Text>
                    </View>
                    <Text style={styles.name}>{profile?.prenom} {profile?.nom}</Text>
                    <Text style={styles.email}>{pb.authStore.model?.email}</Text>
                    <View style={styles.statutBadge}>
                        <Text style={[styles.statutText, { color: statut.color }]}>{statut.label}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniVal}>{totalPesees}</Text>
                        <Text style={styles.statMiniLabel}>Pesées</Text>
                    </View>
                    <View style={styles.statMiniDivider} />
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniVal}>{totalKg}</Text>
                        <Text style={styles.statMiniLabel}>kg pesés</Text>
                    </View>
                    <View style={styles.statMiniDivider} />
                    <View style={styles.statMini}>
                        <Text style={styles.statMiniVal}>
                            {profile?.ville || '—'}
                        </Text>
                        <Text style={styles.statMiniLabel}>Ville</Text>
                    </View>
                </View>

                {/* Infos personnelles */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Informations personnelles</Text>
                        {!editing && (
                            <TouchableOpacity onPress={() => setEditing(true)}>
                                <Text style={styles.editBtn}>✏️ Modifier</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {editing ? (
                        <View style={styles.editForm}>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Prénom</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.prenom}
                                        onChangeText={v => setForm(p => ({ ...p, prenom: v }))}
                                        returnKeyType="next"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Nom</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.nom}
                                        onChangeText={v => setForm(p => ({ ...p, nom: v }))}
                                        returnKeyType="next"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Téléphone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.telephone}
                                    onChangeText={v => setForm(p => ({ ...p, telephone: v }))}
                                    keyboardType="phone-pad"
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ville</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.ville}
                                    onChangeText={v => setForm(p => ({ ...p, ville: v }))}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSave}
                                />
                            </View>

                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setEditing(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Sauvegarder</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.infoList}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Prénom</Text>
                                <Text style={styles.infoVal}>{profile?.prenom}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Nom</Text>
                                <Text style={styles.infoVal}>{profile?.nom}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Téléphone</Text>
                                <Text style={styles.infoVal}>{profile?.telephone || '—'}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Ville</Text>
                                <Text style={styles.infoVal}>{profile?.ville || '—'}</Text>
                            </View>
                        </View>
                    )}
                </View>
                {/* Mot de passe */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mot de passe</Text>
                        {!changingPassword && (
                            <TouchableOpacity onPress={() => setChangingPassword(true)}>
                                <Text style={styles.editBtn}>✏️ Modifier</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {changingPassword ? (
                        <View style={styles.editForm}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Ancien mot de passe</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.text.muted}
                                    value={passwordForm.oldPassword}
                                    onChangeText={v => setPasswordForm(p => ({ ...p, oldPassword: v }))}
                                    secureTextEntry
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nouveau mot de passe</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="8 caractères minimum"
                                    placeholderTextColor={Colors.text.muted}
                                    value={passwordForm.newPassword}
                                    onChangeText={v => setPasswordForm(p => ({ ...p, newPassword: v }))}
                                    secureTextEntry
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.text.muted}
                                    value={passwordForm.confirmPassword}
                                    onChangeText={v => setPasswordForm(p => ({ ...p, confirmPassword: v }))}
                                    secureTextEntry
                                    returnKeyType="done"
                                    onSubmitEditing={handleChangePassword}
                                />
                            </View>

                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        setChangingPassword(false)
                                        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
                                    }}
                                >
                                    <Text style={styles.cancelBtnText}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                    onPress={handleChangePassword}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Confirmer</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.infoList}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Mot de passe</Text>
                                <Text style={styles.infoVal}>••••••••</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Menu */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mon compte</Text>
                    <View style={styles.menuList}>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuIcon}>🔔</Text>
                            <Text style={styles.menuText}>Notifications</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuIcon}>🔒</Text>
                            <Text style={styles.menuText}>Confidentialité</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Déconnexion */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
                </TouchableOpacity>

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
        gap: 16,
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 6,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.green[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.green[400],
        marginBottom: 4,
    },
    avatarEmoji: {
        fontSize: 36,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    email: {
        fontSize: 13,
        color: Colors.text.muted,
    },
    statutBadge: {
        marginTop: 4,
        paddingVertical: 4,
        paddingHorizontal: 14,
        backgroundColor: '#f0faf0',
        borderRadius: 99,
        borderWidth: 1,
        borderColor: '#d4e8d0',
    },
    statutText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
    },
    statMini: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    statMiniVal: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.green[500],
    },
    statMiniLabel: {
        fontSize: 11,
        color: Colors.text.muted,
    },
    statMiniDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#d4e8d0',
    },
    section: {
        gap: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.text.muted,
    },
    editBtn: {
        fontSize: 13,
        color: Colors.green[500],
        fontWeight: '600',
    },
    infoList: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.text.muted,
    },
    infoVal: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0faf0',
        marginVertical: 8,
    },
    editForm: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    input: {
        backgroundColor: '#f0faf0',
        borderWidth: 1.5,
        borderColor: '#d4e8d0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: Colors.text.primary,
    },
    editActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#d4e8d0',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: Colors.green[500],
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    menuList: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d4e8d0',
        borderRadius: 18,
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    menuIcon: {
        fontSize: 18,
        width: 28,
        textAlign: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        color: Colors.text.primary,
    },
    menuArrow: {
        fontSize: 18,
        color: Colors.text.muted,
    },
    logoutBtn: {
        backgroundColor: '#fef2f2',
        borderWidth: 1.5,
        borderColor: '#fecaca',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    logoutText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '600',
    },
})