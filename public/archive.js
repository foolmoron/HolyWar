async function run() {
    const locations = (await db.collectionGroup('history').get())?.docs;
    const datas = locations.map((l) => ({ ...l.data(), path: l.ref.path }));
    const titles = datas.map((d) => d.title);

    const htmls = datas.map(
        (d) => `
            <div class="item" data-path="${d.path}">
                <h1>${d.title}</h1>
                <div class="metadata">
                    <div>
                        <h4>Created By</h4>
                        <h3>${d.ownerName ?? d.owner}</h3>
                    </div>
                    <div>
                        <h3>${d.prompt.replaceAll(/\s+\./g, '.')}</h3>
                    </div>
                </div>
                <div class="description">
                    ${d.desc}
                </div>
                <img src="https://storage.googleapis.com/holy-war-d3052_images/${
                    d.path.split('/')[1] + '_' + d.path.split('/')[3]
                }.png" />
            </div>
        `
    );

    document
        .querySelector('.container')
        .insertAdjacentHTML('beforeend', htmls.join('\n'));

    document.body.classList.add('loaded');
}

run();
