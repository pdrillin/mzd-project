import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://127.0.0.1:8090')

// Types pour nos collections
export type Profile = {
    id: string
    user: string
    nom: string
    prenom: string
    telephone: string
    ville: string
    avatar: string
    statut: 'en_attente' | 'accepte' | 'refuse'
    note_admin: string
    message_candidature: string
}

export type WasteEntry = {
    id: string
    user: string
    poids: number
    categorie: 'organique' | 'recyclable' | 'emballage' | 'residuel'
    note: string
    created: string
}

export type Event = {
    id: string
    titre: string
    description: string
    date_debut: string
    date_fin: string
    lieu: string
}