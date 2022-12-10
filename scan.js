void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }

    const user = (await db.collection('users').doc(auth.email).get())?.data();
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
        location.pathname = '/discover.html';
        return;
    }

    //  "you found: Location X"
    document.write(`<h1>${place.title}</h1>`);
    document.write(`<p>${place.desc}</p>`);
    document.write(`<img src="${place.imageUrl}" />`);

    //  influence sect
    await db.collection(`users/${user.id}/influences`).add({
        loc,
    });

    //  sect X is winning, do you want to convert?
}
