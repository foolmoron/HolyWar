void init();

async function init() {
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

    const location = (await db.collection('locations').doc(id).get()).data();
    if (!location) {
        // get thematic phrases
        const p1 = prompt('Phrase 1');
        const p2 = prompt('Phrase 2');
        const p3 = prompt('Phrase 3');
        const openaiKey = (
            await db.collection('config').doc('openai_key').get()
        ).data().value;

        //  generate title, description
        const completion = await getCompletion(
            openaiKey,
            `Write an impressive and interesting name for a location that would exist in the real world, that exemplifies the following phrases which are separate by newlines. Print the title by itself in a new line, using capitalized words. Then write a detailed 3-sentence description of the above location using flowery prose. Print the description by itself after another new line.\n\n${p1} ${p2} ${p3}`
        );
        const [title, desc] = completion.split('\n\n');
        document.write(`<h1>${title}</h1>`);
        document.write(`<p>${desc}</p>`);

        //  generate image
        const image = await getImage(
            openaiKey,
            `An impressive landscape that matches the following description, paying attention to the nouns, highly detailed with little noise, bold colors, trending on art station: ${p1} ${p2} ${p3}`
        );
        document.write(`<img src="${image}" />`);

        //  save to firebase with location key
    }

    //  "you found: Location X"
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
            size: '1024x1024',
            n: 1,
        }),
    }).then((res) => res.json());
    return data.data[0].url;
}
