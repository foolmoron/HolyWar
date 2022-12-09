void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }

    const id = localStorage.getItem('id');
    if (!id) {
        const name = prompt('Name');
        const sect = prompt('Sect');
        const doc = await db.collection('users').add({
            name,
            sect,
        });
        localStorage.setItem('id', doc.id);
    }
    location.pathname = '/scan.html';
}
