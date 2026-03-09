import { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { pb } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function RegisterScreen() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        email: '',
        password: '',
        passwordConfirm: '',
        nom: '',
        prenom: '',
        telephone: '',
        ville: '',
        message_candidature: '',
    })

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleRegister = async () => {
        // Validations
        if (!form.email || !form.password || !form.nom || !form.prenom || !form.message_candidature) {
            Alert.alert('Erreur', 'Merci de remplir tous les champs obligatoires')
            return
        }

        if (form.password !== form.passwordConfirm) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas')
            return
        }

        if (form.password.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères')
            return
        }

        setLoading(true)
        try {
            // 1. Créer le compte user
            const user = await pb.collection('users').create({
                email: form.email,
                password: form.password,
                passwordConfirm: form.passwordConfirm,
            })

            // 2. Créer le profil + candidature
            await pb.collection('profiles').create({
                user: user.id,
                nom: form.nom,
                prenom: form.prenom,
                telephone: form.telephone,
                ville: form.ville,
                message_candidature: form.message_candidature,
                statut: 'en_attente',
            })

            Alert.alert(
                'Candidature envoyée ! 🌿',
                'Votre demande a bien été enregistrée. Un administrateur va examiner votre candidature et vous recevrez une réponse prochainement.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            )

        } catch (error: any) {
            if (error?.data?.email) {
                Alert.alert('Erreur', 'Cet email est déjà utilisé')
            } else {
                Alert.alert('Erreur', 'Une erreur est survenue, veuillez réessayer')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🌿</Text>
                    <Text style={styles.title}>Rejoindre MZD Connect</Text>
                    <Text style={styles.subtitle}>
                        Remplissez ce formulaire pour soumettre votre candidature
                    </Text>
                </View>

                {/* Section compte */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Votre compte</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="votre@email.com"
                            placeholderTextColor={Colors.text.muted}
                            value={form.email}
                            onChangeText={v => updateField('email', v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="8 caractères minimum"
                            placeholderTextColor={Colors.text.muted}
                            value={form.password}
                            onChangeText={v => updateField('password', v)}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmer le mot de passe <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.text.muted}
                            value={form.passwordConfirm}
                            onChangeText={v => updateField('passwordConfirm', v)}
                            secureTextEntry
                        />
                    </View>
                </View>

                {/* Section infos personnelles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Prénom <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Jean"
                                placeholderTextColor={Colors.text.muted}
                                value={form.prenom}
                                onChangeText={v => updateField('prenom', v)}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Nom <Text style={styles.required}>*</Text></Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Dupont"
                                placeholderTextColor={Colors.text.muted}
                                value={form.nom}
                                onChangeText={v => updateField('nom', v)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="06 00 00 00 00"
                            placeholderTextColor={Colors.text.muted}
                            value={form.telephone}
                            onChangeText={v => updateField('telephone', v)}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ville</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Montpellier"
                            placeholderTextColor={Colors.text.muted}
                            value={form.ville}
                            onChangeText={v => updateField('ville', v)}
                        />
                    </View>
                </View>

                {/* Section candidature */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Votre candidature</Text>
                    <Text style={styles.sectionDesc}>
                        Expliquez-nous pourquoi vous souhaitez rejoindre Montpellier Zéro Déchets
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message de motivation <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textarea]}
                            placeholder="Je souhaite rejoindre MZD car..."
                            placeholderTextColor={Colors.text.muted}
                            value={form.message_candidature}
                            onChangeText={v => updateField('message_candidature', v)}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Bouton submit */}
                <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.btnText}>Envoyer ma candidature 🌿</Text>
                    )}
                </TouchableOpacity>

                {/* Lien login */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>
                        ← Déjà un compte ? Se connecter
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg.light,
    },
    scroll: {
        padding: 24,
        gap: 24,
    },
    header: {
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
    },
    emoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.green[500],
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.muted,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        borderLeftWidth: 3,
        borderLeftColor: Colors.green[500],
        paddingLeft: 10,
    },
    sectionDesc: {
        fontSize: 13,
        color: Colors.text.muted,
        lineHeight: 18,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    required: {
        color: '#dc2626',
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
    textarea: {
        height: 120,
        paddingTop: 14,
    },
    btn: {
        backgroundColor: Colors.green[500],
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    backLink: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    backLinkText: {
        color: Colors.text.muted,
        fontSize: 14,
    },
})