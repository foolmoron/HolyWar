void run();

async function run() {
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

    document.body.classList.add('loaded');

    const ownedLocations = (
        await db.collection('places').where('owner', '==', userId).get()
    )?.docs;

    document.body.insertAdjacentHTML('beforeend', `<h1>${user.name}</h1>`);
    document.body.insertAdjacentHTML(
        'beforeend',
        `<h3>Score: ${user.score ?? 0}</h3>`
    );
    document.body.insertAdjacentHTML(
        'beforeend',
        `<h3>Sect: ${user.sect}</h3>`
    );

    document.body.insertAdjacentHTML('beforeend', `<h2>Owned Locations</h2>`);
    for (const loc of ownedLocations) {
        const data = loc.data();
        document.body.insertAdjacentHTML(
            'beforeend',
            `<h3><a href="./scan?loc=${loc.id}">${loc.data().title}</a></h3>`
        );
    }
}
