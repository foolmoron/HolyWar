void run();

async function run() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const user = (await db.collection('users').doc(userId).get())?.data();
    if (!user) {
        location.pathname = '/init';
        return;
    }
    console.log('user', user);

    const ownedLocations = (
        await db.collection('places').where('owner', '==', userId).get()
    )?.docs;

    document.body.insertAdjacentHTML('beforeend', `<h1>${user.name}</h1>`);
    document.body.insertAdjacentHTML(
        'beforeend',
        `<h2>Score: <span class="score">${(
            user.score ?? 0
        ).toLocaleString()}</span></h2>`
    );
    document.body.insertAdjacentHTML(
        'beforeend',
        `<a href="./leaderboard"><h4>see full leaderboard</h4></a>`
    );

    document.body.insertAdjacentHTML('beforeend', `<h2>Owned Locations</h2>`);
    for (const loc of ownedLocations) {
        const data = loc.data();
        document.body.insertAdjacentHTML(
            'beforeend',
            `<a href="./scan?loc=${loc.id}"><h4>${loc.data().title}</h4></a>`
        );
    }

    document.body.insertAdjacentHTML('beforeend', `<h2>Recent Influences</h2>`);
    const recentInfluences = (
        await db
            .collection(`users/${userId}/influences`)
            .orderBy('time', 'desc')
            .limit(10)
            .get()
    )?.docs;
    for (const influence of recentInfluences) {
        const data = influence.data();
        document.body.insertAdjacentHTML(
            'beforeend',
            `<a href="./scan?loc=${
                data.loc
            }"><h4><span style="color: white;">${new Date(
                data.time
            ).toLocaleString()}${
                data.points > 1 ? ' (3x pts)' : ''
            }:</span><br>${data.title}</h4></a>`
        );
    }

    document.body.classList.add('loaded');
}
