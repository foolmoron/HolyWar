void run();

async function run() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;
    const name = auth.displayName;

    const user = (await db.collection('users').doc(userId).get())?.data();
    if (!user) {
        const sect = prompt('Sect');
        const doc = await db.collection('users').doc(userId).set({
            name,
            sect,
        });
    }
    location.pathname = '/scan.html';
}
