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

    const list = document.querySelector('ol');
    for (const user of users) {
        const data = user.data();
        let line = '';
        line += `<li class="${user.id === userId ? 'you' : ''}">${data.name}`;
        if (user.id === sectLeaders[data.sect]) {
            line += ` (Leader of ${data.sect})`;
        }
        line += `<br><span class="score">${data.score ?? 0}</span>`;
        line += '</li>';
        list.insertAdjacentHTML('beforeend', line);
    }

    document.body.classList.add('loaded');
}
