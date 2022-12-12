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

    const ownedLocations = (
        await db.collection('places').where('owner', '==', userId).get()
    )?.docs;

    document.body.insertAdjacentHTML('beforeend', `<h1>${user.name}</h1>`);
    document.body.insertAdjacentHTML(
        'beforeend',
        `<h4>Score: ${user.score ?? 0}</h4>`
    );

    document.body.insertAdjacentHTML('beforeend', `<h2>Owned Locations</h2>`);
    for (const loc of ownedLocations) {
        const data = loc.data();
        document.body.insertAdjacentHTML(
            'beforeend',
            `<h4><a href="./scan?loc=${loc.id}">${loc.data().title}</a></h4>`
        );
    }

    document.body.insertAdjacentHTML('beforeend', `<h2>Recent Influences</h2>`);
    const recentInfluences = (
        await db
            .collection(`users/${userId}/influences`)
            .orderBy('time', 'desc')
            .get()
    )?.docs;
    for (const influence of recentInfluences) {
        const data = influence.data();
        document.body.insertAdjacentHTML(
            'beforeend',
            `<h4>${new Date(
                data.time
            ).toLocaleString()}:<br><a href="./scan?loc=${data.loc}">${
                data.title
            }</a></h4>`
        );
    }

    document.body.classList.add('loaded');
}
