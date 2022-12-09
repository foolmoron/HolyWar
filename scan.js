const DESC_PROMPT = `Write an interesting name for a location that would exist at some point in the history of real world Earth, that ties together the spirit and meaning of the following phrases which are separated by newlines. Print the title by itself in a new line, using capitalized words. Then write a 2-sentence description of maximum 700 characters of the above location using flowery prose, which incorporates the key nouns in the phrases repeatedly and with great detail. Print the description by itself after another new line.\n\n`;
const IMAGE_PROMPT = `An impressive award-winning landscape that matches the following description, high definition with lots of lines and bold colors, in the style of famous illustrators, trending on art station: `;

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
        // get thematic phrases
        const p1 = prompt('Phrase 1');
        const p2 = prompt('Phrase 2');
        const p3 = prompt('Phrase 3');
        const p = `${p1}. \n${p2}. \n${p3}. `;

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
        await db.collection('places').doc(loc).set({
            title,
            desc,
            imageUrl,
            prompt: p,
        });

        // reload to rescan with the new location
        location.reload();
    }

    //  "you found: Location X"
    document.write(`<h1>${place.title}</h1>`);
    document.write(`<p>${place.desc}</p>`);
    document.write(`<img src="${place.imageUrl}" />`);
    //  influence sect
    //      increment points for all users in sect
    //  sect X is winning, do you want to convert?
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
    return data.data[0].url;
}
