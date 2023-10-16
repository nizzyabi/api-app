// firebase initalization and firestore
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// cred.json is from firestore download that we got off firebase settings page after generating a new private key: https://console.firebase.google.com/u/0/project/api-key-gen-ea655/settings/serviceaccounts/adminsdk

let serviceAccount = require('./creds.json')

initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore()

module.exports = { db }