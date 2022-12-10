const DESC_PROMPT = `Write an interesting name for a location that would exist at some point in the history of real world Earth, that ties together the spirit and meaning of the following phrases which are separated by newlines. Print the title by itself in a new line, using capitalized words. Then write a 2-sentence present tense description between 400 and 700 characters of the above location using a solemn, religious, historical style of prose. The description must incorporate the key nouns in the phrases in a meaningful way. Print the description by itself after another new line.\n\n`;
const IMAGE_PROMPT = `An impressive award-winning landscape that matches the following description, high definition with lots of lines and bold colors, in the style of famous illustrators, trending on art station: `;

void init();

async function init() {
    const auth = await authUser();
    if (!auth) {
        return;
    }
    const userId = auth.email;

    const url = new URL(window.location.href);
    const loc = url.searchParams.get('loc');
    console.log('loc', loc);

    if (!loc) {
        return;
    }

    const place = (await db.collection('places').doc(loc).get()).data();
    if (place) {
        location.pathname = '/scan.html';
        return;
    }

    // get thematic phrases
    const p1 = prompt('Phrase 1');
    const p2 = prompt('Phrase 2');
    const p3 = prompt('Phrase 3');
    if (!p1 || !p2 || !p3) {
        return;
    }
    const p = `${p1}. \n${p2}. \n${p3}. `;

    //  generate title, description
    const openaiKey = (
        await db.collection('config').doc('openai_key').get()
    ).data().value;
    const completion = await getCompletion(openaiKey, `${DESC_PROMPT} ${p}`);
    const [title, desc] = completion.split('\n\n');

    //  generate image
    const imageUrl = await getImage(openaiKey, `${IMAGE_PROMPT} ${p}`);

    //  save to firebase with location key
    await db.collection('places').doc(loc).set({
        title,
        desc,
        imageUrl,
        prompt: p,
        owner: userId,
    });

    // back to scan with the new location
    location.pathname = '/scan.html';
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
