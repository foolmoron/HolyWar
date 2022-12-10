void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const user = (await db.collection('users').doc(userId).get())?.data();
    if (!user) {
        const name = prompt('Name');
        const sect = prompt('Sect');
        const doc = await db.collection('users').doc(userId).set({
            name,
            sect,
        });
    }
    location.pathname = '/scan.html';
}
