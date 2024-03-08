const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

class FirebaseSingleton {
    constructor() {
        this.firebaseConfig = {
            apiKey: process.env.API_KEY,
            authDomain: process.env.AUTH_DOMAIN,
            projectId: process.env.PROJECT_ID,
            storageBucket: process.env.STORAGE_BUCKET,
            messagingSenderId: process.env.MESSAGING_SENDER_ID,
            appId: process.env.APP_ID,
            measurementId: process.env.MEASUREMENT_ID
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(this.firebaseConfig);
            console.log('Firebase initialized');
        }

        console.log('created db');

        this.db = firebase.firestore();
    }

    static getInstance() {
        if (!FirebaseSingleton.instance) {
            FirebaseSingleton.instance = new FirebaseSingleton();
        }
        return FirebaseSingleton.instance;
    }

    getDatabase() {
        return this.db;
    }
}

module.exports = FirebaseSingleton;
