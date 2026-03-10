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
} from 'react-native'
import { useRouter } from 'expo-router'
import { pb } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function LoginScreen() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Merci de remplir tous les champs')
            return
        }

        setLoading(true)
        try {
            await pb.collection('users').authWithPassword(email, password)
            console.log('✅ Auth OK, user:', pb.authStore.model?.id)

            // Vérifier le statut du profil
            const profile = await pb.collection('profiles').getFirstListItem(
                `user = "${pb.authStore.model?.id}"`
            )
            console.log('✅ Profile OK, statut:', profile.statut)

            if (profile.statut === 'en_attente') {
                Alert.alert(
                    'Compte en attente',
                    'Votre candidature est en cours de validation par un administrateur.'
                )
                pb.authStore.clear()
                return
            }

            if (profile.statut === 'refuse') {
                Alert.alert(
                    'Accès refusé',
                    'Votre candidature a été refusée. Contactez un administrateur.'
                )
                pb.authStore.clear()
                return
            }

            // Statut accepté → accès à l'app
            router.replace('/(tabs)')

        } catch (error: any) {
            Alert.alert('Erreur', 'Email ou mot de passe incorrect')
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>

                {/* Logo / Titre */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🌿</Text>
                    <Text style={styles.title}>MZD Connect</Text>
                    <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
                </View>

                {/* Formulaire */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="votre@email.com"
                            placeholderTextColor={Colors.text.muted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.btnText}>Se connecter</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Lien inscription */}
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.registerLink}>
                        Pas encore de compte ?{' '}
                        <Text style={styles.registerLinkBold}>Candidater</Text>
                    </Text>
                </TouchableOpacity>

            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg.light,
    },
    inner: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        gap: 32,
    },
    header: {
        alignItems: 'center',
        gap: 8,
    },
    emoji: {
        fontSize: 56,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.green[500],
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: Colors.text.muted,
        textAlign: 'center',
    },
    form: {
        gap: 16,
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
    btn: {
        backgroundColor: Colors.green[500],
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    registerLink: {
        textAlign: 'center',
        color: Colors.text.muted,
        fontSize: 14,
    },
    registerLinkBold: {
        color: Colors.green[500],
        fontWeight: '700',
    },
})