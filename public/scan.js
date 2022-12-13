void run();

function lerp(a, b, t) {
    return a + (b - a) * t;
}

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
        location.pathname = '/init';
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
        location.pathname = '/index';
        return;
    }
    if (!place.owner) {
        location.pathname = '/discover';
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
    let currentX = 0.5;
    let currentY = 0.5;
    let desiredX = 0.5;
    let desiredY = 0.5;
    let velX = 0.5;
    let velY = 0.5;
    window.addEventListener(
        'deviceorientation',
        ({ beta, gamma }) => {
            if (betaOrig === null) {
                betaOrig = beta;
            }
            if (gammaOrig === null) {
                gammaOrig = gamma;
            }

            desiredX =
                Math.max(-16, Math.min(16, gamma - gammaOrig)) / 32 + 0.5;
            desiredY = Math.max(-16, Math.min(16, beta - betaOrig)) / 32 + 0.5;
        },
        true
    );
    let t = Date.now();
    function updateBg() {
        requestAnimationFrame(updateBg);
        const dt = (Date.now() - t) / 1000;
        t = Date.now();

        const ACCEL = 0.2;
        const VFACTOR = 1.5;
        if (Math.abs(desiredX - currentX) < 0.001) {
            currentX = desiredX;
        } else {
            velX = lerp(velX, desiredX - currentX, ACCEL);
            currentX += velX * dt * VFACTOR;
        }
        if (Math.abs(desiredY - currentY) < 0.001) {
            currentY = desiredY;
        } else {
            velY = lerp(velY, desiredY - currentY, ACCEL);
            currentY += velY * dt * VFACTOR;
        }

        document.documentElement.style.setProperty(
            '--bg-x',
            `${currentX * 100}%`
        );
        document.documentElement.style.setProperty(
            '--bg-y',
            `${currentY * 100}%`
        );
    }
    updateBg();

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
                influenceBtn.textContent += ' | 3x pts';
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
            ).innerHTML = `Influenced location! <b>+<span style="font-family: monospace;">${pts}</span> points</b> to you and <span style="font-family: monospace;">${sectmateCount}</span> other member${
                sectmateCount > 1 ? 's' : ''
            } of your sect. See the <a href="./leaderboard">leaderboard</a> or the <a href="./index">home page</a> for your current score.`;
            latestInfluenceTime = Date.now();
        });

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 400); // wait a bit for image to load

    //  sect X is winning, do you want to convert?
}
