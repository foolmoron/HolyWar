void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }

    const user = (await db.collection('users').doc(auth.email).get())?.data();
    if (!user) {
        const name = prompt('Name');
        const sect = prompt('Sect');
        const doc = await db.collection('users').doc(auth.email).set({
            name,
            sect,
        });
    }
    location.pathname = '/scan.html';
}
