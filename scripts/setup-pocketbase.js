const PocketBase = require('pocketbase/cjs')

const pb = new PocketBase('http://127.0.0.1:8090')

const ADMIN_EMAIL = 'mzd@test.com'    // ← change par ton email admin
const ADMIN_PASSWORD = 'passmzd1' // ← change par ton mot de passe admin

async function setup() {
    console.log('🌿 Setup MZD Connect — PocketBase\n')

    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Connecté en admin')

    // ===== PROFILES =====
    try {
        const profilesCollection = await pb.collections.create({
            name: 'profiles',
            type: 'base',
            fields: [
                { name: 'user',                type: 'relation', required: true,
                    collectionId: '_pb_users_auth_', maxSelect: 1
                },
                { name: 'nom',                 type: 'text',   required: true  },
                { name: 'prenom',              type: 'text',   required: true  },
                { name: 'telephone',           type: 'text',   required: false },
                { name: 'ville',               type: 'text',   required: false },
                { name: 'statut',              type: 'select', required: true,
                    values: ['en_attente', 'accepte', 'refuse'], maxSelect: 1
                },
                { name: 'note_admin',          type: 'text',   required: false },
                { name: 'message_candidature', type: 'text',   required: true  },
            ],
            listRule:   '@request.auth.id != ""',
            viewRule:   '@request.auth.id != ""',
            createRule: '',
            updateRule: '',
            deleteRule: null,
        })
        console.log('✅ Collection profiles créée')

        await pb.collections.update(profilesCollection.id, {
            updateRule: 'user = @request.auth.id',
        })
        console.log('✅ Règles profiles mises à jour')

    } catch (e) {
        console.log('⚠️  profiles:', e.message)
    }

    // ===== WASTE_ENTRIES =====
    try {
        const profilesCollection = await pb.collections.getFirstListItem('name="profiles"')
        console.log('✅ ID profiles récupéré:', profilesCollection.id)

        await pb.collections.create({
            name: 'waste_entries',
            type: 'base',
            fields: [
                { name: 'profile',   type: 'relation', required: true,
                    collectionId: profilesCollection.id, maxSelect: 1
                },
                { name: 'poids_kg',  type: 'number',   required: true  },
                { name: 'categorie', type: 'select',   required: true,
                    values: ['organique', 'recyclable', 'emballage', 'residuel'], maxSelect: 1
                },
                { name: 'note',      type: 'text',     required: false },
            ],
            listRule:   '@request.auth.id != ""',
            viewRule:   '@request.auth.id != ""',
            createRule: '@request.auth.id != ""',
            updateRule: '@request.auth.id != ""',
            deleteRule: '@request.auth.id != ""',
        })
        console.log('✅ Collection waste_entries créée')
    } catch (e) {
        console.log('⚠️  waste_entries:', e.message)
    }

    // ===== EVENTS =====
    try {
        await pb.collections.create({
            name: 'events',
            type: 'base',
            fields: [
                { name: 'titre',       type: 'text', required: true  },
                { name: 'description', type: 'text', required: false },
                { name: 'date_debut',  type: 'date', required: true  },
                { name: 'date_fin',    type: 'date', required: false },
                { name: 'lieu',        type: 'text', required: false },
            ],
            listRule:   '',
            viewRule:   '',
            createRule: null,
            updateRule: null,
            deleteRule: null,
        })
        console.log('✅ Collection events créée')
    } catch (e) {
        console.log('⚠️  events:', e.message)
    }

    console.log('\n🎉 Setup terminé !')
}

setup().catch(err => {
    console.error('❌ Erreur:', err)
    process.exit(1)
})