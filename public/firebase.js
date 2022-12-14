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
    const alerted = localStorage.getItem('alerted');
    if (!alerted) {
        alert(
            "The game is over! Press OK to continue to the page, but you can't interact anymore. Go to holywar.fool.dev/leaderboard to get the full Leaderboard."
        );
        localStorage.setItem('alerted', true);
    }

    const googleProvider = new firebase.auth.GoogleAuthProvider();
    try {
        const cachedUser = await new Promise((resolve) => {
            auth.onAuthStateChanged(resolve);
        });
        if (cachedUser) {
            return cachedUser;
        }
    } catch (e) {
        alert('1:' + JSON.stringify(e));
    }

    try {
        const res = await auth.getRedirectResult();
        if (res.user) {
            return res.user;
        }
    } catch (e) {
        alert('2:' + JSON.stringify(e));
    }

    // No existing auth, try to sign in
    if (
        confirm(
            "Press OK to sign in with Google (default). If you're having Google troubles, press Cancel to sign in with a password (ask Momin for it)."
        )
    ) {
        await auth.signInWithRedirect(googleProvider);
    } else {
        const email = prompt('Email:');
        const password = prompt('Password:');
        try {
            const res = await auth.signInWithEmailAndPassword(email, password);
            if (res.user) {
                return res.user;
            }
        } catch (e) {
            alert('3:' + JSON.stringify(e));
        }
    }
}
