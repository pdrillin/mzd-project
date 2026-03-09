import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { pb } from '../../lib/pocketbase'
import { Colors } from '../../constants/colors'

export default function ProfileScreen() {
    const router = useRouter()

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
            pb.authStore.clear()
            router.replace('/(auth)/login')
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mon Profil</Text>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg.light,
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.green[500],
        marginBottom: 32,
    },
    logoutBtn: {
        backgroundColor: '#fef2f2',
        borderWidth: 1.5,
        borderColor: '#fecaca',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 'auto',
    },
    logoutText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '600',
    },
})