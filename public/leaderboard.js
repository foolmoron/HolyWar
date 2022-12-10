void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const users = (await db.collection('users').orderBy('score', 'desc').get())
        ?.docs;

    document.write(`<h1>Leaderboard</h1>`);
    for (const user of users) {
        const data = user.data();
        document.write(`<h3>${user.id}: ${data.score ?? 0}</h2>`);
    }
}
