void run();

async function run() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;
    const influenceBtn = document.querySelector('.influence');

    const limitHours =
        (await (await db.doc('config/influence_limit_hours').get()).data()
            ?.value) ?? 8;

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

    // Disable button with timer
    let latestInfluenceTime =
        (
            await db
                .collection(`users/${userId}/influences`)
                .where('loc', '==', loc)
                .orderBy('time', 'desc')
                .limit(1)
                .get()
        ).docs[0]?.data()?.time ?? 0;
    function secsToString(secs) {
        secs = Math.abs(secs);
        const hours = Math.floor(secs / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        const seconds = Math.floor(secs % 60);
        const str = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
        return str;
    }
    function updateButton() {
        const timeToNextInfluence =
            latestInfluenceTime +
            30 * 1000 + // little extra buffer
            limitHours * 60 * 60 * 1000 -
            Date.now();
        if (timeToNextInfluence > 0) {
            influenceBtn.setAttribute('disabled', 'disabled');
            influenceBtn.textContent = secsToString(timeToNextInfluence / 1000);
        } else {
            influenceBtn.removeAttribute('disabled');
            influenceBtn.textContent = `Influence`;
            if (place.owner === userId) {
                influenceBtn.textContent += ' (3x pts)';
            }
        }
    }
    setInterval(updateButton, 500);
    updateButton();

    // Press button to influence
    document
        .querySelector('.influence')
        .addEventListener('click', async (e) => {
            e.stopPropagation();
            await db.collection(`users/${userId}/influences`).add({
                loc,
                title: place.title,
            });
            document.body.classList.add('influenced');
            const pts = place.owner === userId ? 3 : 1;
            const sectmateCount = await db
                .collection('users')
                .where('sect', '==', user.sect)
                .get()
                .then((res) => res.size);
            document.querySelector(
                '.influence-msg'
            ).innerHTML = `Influenced location! <b>+${pts} points</b> to you and ${sectmateCount} other members of your sect. See the <a href="./leaderboard.html">Leaderboard</a> or the <a href="./index.html">Home page</a>.`;
            latestInfluenceTime = Date.now();
        });

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 400); // wait a bit for image to load

    //  sect X is winning, do you want to convert?
}
