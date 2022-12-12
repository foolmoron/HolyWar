void run();

async function run() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const users = (await db.collection('users').orderBy('score', 'desc').get())
        ?.docs;

    const sectLeaders = {};
    for (const user of users) {
        const data = user.data();
        if (data.sect && !sectLeaders[data.sect]) {
            sectLeaders[data.sect] = user.id;
        }
    }

    document.body.insertAdjacentHTML('beforeend', `<h1>Leaderboard</h1>`);
    for (const user of users) {
        const data = user.data();
        let line = '';
        if (user.id === userId) {
            line += `<h3><b>${data.name}: ${data.score ?? 0}</b>`;
        } else {
            line += `<h3>${data.name}: ${data.score ?? 0}`;
        }
        if (user.id === sectLeaders[data.sect]) {
            line += `<br>(Leader of ${data.sect})`;
        }
        line += '</h3>';
        document.body.insertAdjacentHTML('beforeend', line);
    }

    document.body.classList.add('loaded');
}
