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

    const url = new URL(window.location.href);
    const loc = url.searchParams.get('loc');
    console.log('loc', loc);

    if (!loc) {
        return;
    }

    const place = (await db.collection('places').doc(loc).get()).data();
    if (!place) {
        location.pathname = '/index.html';
        return;
    }
    if (!place.owner) {
        location.pathname = '/discover.html';
        return;
    }

    //  "you found: Location X"
    document.querySelector('.title').innerHTML = place.title;
    document.querySelector('.desc').innerHTML = place.desc;
    document.documentElement.style.setProperty(
        '--bg-img',
        `url(${place.imageUrl})`
    );

    // Orientation affects background
    let betaOrig = null;
    let gammaOrig = null;
    window.addEventListener(
        'deviceorientation',
        ({ beta, gamma }) => {
            if (betaOrig === null) {
                betaOrig = beta;
            }
            if (gammaOrig === null) {
                gammaOrig = gamma;
            }

            const x = Math.max(-18, Math.min(18, gamma - gammaOrig)) / 36 + 0.5;
            document.documentElement.style.setProperty('--bg-x', `${x * 100}%`);

            const y = Math.max(-18, Math.min(18, beta - betaOrig)) / 36 + 0.5;
            document.documentElement.style.setProperty('--bg-y', `${y * 100}%`);
        },
        true
    );

    // Tap body to hide ui
    document.body.addEventListener('click', (e) => {
        document.body.classList.toggle('hide-ui');
    });

    // Press button to influence
    document
        .querySelector('.influence')
        .addEventListener('click', async (e) => {
            e.stopPropagation();
            await db.collection(`users/${userId}/influences`).add({
                loc,
            });
        });

    //  sect X is winning, do you want to convert?
}
