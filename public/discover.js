const DESC_PROMPT = `Write an interesting name for a location that would exist at some point in the history of real world Earth, that ties together the spirit and meaning of the following phrases which are separated by newlines. Print the title by itself in a new line, using capitalized words. Then write a present tense description between 500 and 700 characters of the above location using a solemn, religious, historical style of prose. The description must incorporate the key nouns in the phrases in a meaningful way. Print the description by itself after another new line.\n\n`;
const IMAGE_PROMPT = `A religious painting in the style of the Sistine Chapel by Michelangelo, high definition with sharp lines and bold colors, trending on artstation, that illustrates a location with the following description: `;

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
    if (place.owner) {
        location.pathname = '/scan';
        return;
    }

    document.body.classList.add('loaded');

    let submitted = false;
    document.querySelector('form').addEventListener('submit', async (e) => {
        if (submitted) {
            return;
        }
        submitted = true;
        e.preventDefault();
        document.body.classList.add('generating');

        const data = new FormData(e.target);
        const p = `${data.get('tenet1')}. \n${data.get('tenet2')}. \n${data.get(
            'tenet3'
        )}.`;

        //  generate title, description
        const openaiKey = (
            await db.collection('config').doc('openai_key').get()
        ).data().value;
        const completion = await getCompletion(
            openaiKey,
            `${DESC_PROMPT} ${p}`
        );
        const [title, desc] = completion.split('\n\n');

        //  generate image
        const imageUrl = await getImage(openaiKey, `${IMAGE_PROMPT} ${p}`);

        //  save to firebase with location key
        await db.collection('places').doc(loc).update({
            title,
            desc,
            imageUrl,
            prompt: p,
            owner: userId,
        });

        // back to scan with the new location
        location.pathname = '/scan';
    });

}

async function getCompletion(key, prompt) {
    const data = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt,
            temperature: 0.7,
            max_tokens: 256,
        }),
    }).then((res) => res.json());
    if (data.error) {
        const message = `The AI ran into the following error! Try again.\n\n${data.error.message}`;
        alert(message);
        location.reload();
        throw new Error(data.error);
    }
    return data.choices[0].text.trim();
}

async function getImage(key, prompt) {
    const data = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            prompt,
            size: '512x512',
            n: 1,
        }),
    }).then((res) => res.json());
    if (data.error) {
        const message = `The AI ran into the following error! If it mentions the "safety system", it's because you have something "offensive" in your input. Try again with something more Christian. \n\n${data.error.message}`;
        alert(message);
        location.reload();
        throw new Error(data.error);
    }
    return data.data[0].url;
}
