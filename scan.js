void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }

    const id = localStorage.getItem('id');
    if (!id) {
        location.pathname = '/init.html';
        return;
    }

    const user = (await db.collection('users').doc(id).get()).data();
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
    //      increment points for all users in sect
    //  sect X is winning, do you want to convert?
}
