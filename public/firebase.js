const firebaseConfig = {
    apiKey: 'AIzaSyDYdrZkrWys0g3i_1D32ffFKxQ6XGqrUpM',
    authDomain: 'holy-war-d3052.firebaseapp.com',
    projectId: 'holy-war-d3052',
    storageBucket: 'holy-war-d3052.appspot.com',
    messagingSenderId: '701149485710',
    appId: '1:701149485710:web:95e260d6f6e51e2e2cc7df',
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

async function authUser() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const cachedUser = await new Promise((resolve) => {
            auth.onAuthStateChanged(resolve);
        });
        if (cachedUser) {
            return cachedUser;
        }
    } catch (e) {
        console.error(e);
    }

    try {
        const res = await auth.getRedirectResult();
        if (res.user) {
            return res.user;
        }
    } catch (e) {
        console.error(e);
    }

    // No existing auth, try to sign in
    await auth.signInWithRedirect(provider);
}
