void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const user = (await db.collection('users').doc(userId).get())?.data();
    if (!user) {
        location.pathname = '/init.html';
        return;
    }
    console.log('user', user);

    document.write(`<h1>${user.name}</h1>`);
    document.write(`<h2>Score: ${user.score ?? 0}</h2>`);
    document.write(`<h2>Sect: ${user.sect}</h2>`);
}
