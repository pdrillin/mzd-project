import { useEffect, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { pb } from '../lib/pocketbase'

export default function RootLayout() {
    const router = useRouter()
    const segments = useSegments()
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const user = pb.authStore.model

        if (!user) {
            router.replace('/(auth)/login')
        } else if (user && segments[0] === '(auth)') {
            router.replace('/(tabs)/')
        }

        setIsReady(true)
    }, [])

    if (!isReady) return null

    return <Slot />
}