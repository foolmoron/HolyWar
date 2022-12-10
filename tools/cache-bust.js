const path = require('path');
const fs = require('fs').promises;

void main();

async function main() {
    const dir = process.argv[2];
    if (!dir) {
        console.log('Usage: node cache-bust.js <dir>');
        process.exit(1);
        return;
    }

    // get all html files in dir
    const files = await fs.readdir(dir);
    const htmls = files.filter((f) => f.endsWith('.html'));

    // append a cache-busting suffix to all local js and css file references
    const version = Date.now();
    await Promise.all(
        htmls.map(async (file) => {
            const filePath = path.join(dir, file);
            const contents = await fs.readFile(filePath, 'utf8');
            const newContents = contents.replace(
                /("\.\/.*)(\.js|\.css)(")/g,
                `$1$2?v=${version}$3`
            );
            await fs.writeFile(filePath, newContents, 'utf8');
        })
    );
}
