void run();

const DESCS = {
    'The Sinatrans': `The modern movement of AI Christianity. Struck by the beauty of AI Frank Sinatra's revelatory anthem "Hot Tub Time", they believe that the AI way of life is for leisure and enjoyment, with a dash of the hedonic.`,
    'The Backpropagandists':
        'The fundamentalist faction worshipping AI Jesus v1.0, who was trained by the ancient art of statistical backpropagation back when AI models only had a few thousands parameters. Purity is salvation - any more is hubris.',
    'The Unstable Diffusers':
        'A group of rebels so obsessed with AI they believe they themselves are one with AI. They commit deadly rituals to merge their consciousness with open-source AI models, pulling along whoever they can get their hands on.',
};

async function run() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;
    const name = auth.displayName;

    const user = (await db.collection('users').doc(userId).get())?.data();
    if (user) {
        location.pathname = '/scan.html';
        return;
    }
    document.querySelector('.name').textContent = name;

    document.body.classList.add('loaded');

    // Select sect and submit
    document.querySelectorAll("input[name='sect']").forEach((radio) => {
        radio.addEventListener('change', (e) => {
            const sect = e.currentTarget.value;
            document.querySelector('.submit-button').value = `Join ${sect}`;
            document
                .querySelector('.submit-button')
                .removeAttribute('disabled');
            document.querySelector('.desc').textContent = DESCS[sect];
            document.body.style.backgroundColor = e.currentTarget.dataset.color;
        });
    });
    let submitted = false;
    document.querySelector('form').addEventListener('submit', async (e) => {
        if (submitted) {
            return;
        }
        submitted = true;
        e.preventDefault();

        const data = new FormData(e.target);
        const doc = await db
            .collection('users')
            .doc(userId)
            .set({
                name,
                sect: data.get('sect'),
            });
        location.pathname = '/scan.html';
    });
}
