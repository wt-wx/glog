import fs from 'fs';
import path from 'path';

const inputPath = 'd:/Documents/Project/glog/public/bookmarks_2025_11_2.html';
const content = fs.readFileSync(inputPath, 'utf-8');

// More robust regex to handle various attributes and spacing
const allTagsRegex = /<(H3|A)[^>]*>([\s\S]*?)<\/\1>/gi;
const hrefRegex = /HREF="([^"]*)"/i;
const iconRegex = /ICON="([^"]*)"/i;

const allLinks = [];

let match;
while ((match = allTagsRegex.exec(content)) !== null) {
    const tagName = match[1].toUpperCase();
    const tagContent = match[2].trim();
    const fullTag = match[0];

    if (tagName === 'A') {
        const hrefMatch = hrefRegex.exec(fullTag);
        if (hrefMatch) {
            const url = hrefMatch[1];
            const title = tagContent.replace(/<[^>]*>/g, '').trim() || url;
            const iconMatch = iconRegex.exec(fullTag);
            const icon = iconMatch ? iconMatch[1] : null;

            allLinks.push({ url, title, icon });
        }
    }
}

// Group by domain
const groups = {};
allLinks.forEach(link => {
    try {
        const domain = new URL(link.url).hostname.replace(/^www\./, '');
        if (!groups[domain]) {
            groups[domain] = [];
        }
        groups[domain].push(link);
    } catch (e) {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(link);
    }
});

// Convert to array and sort by number of links or name
const sortedGroups = Object.keys(groups).map(domain => ({
    name: domain,
    links: groups[domain]
})).sort((a, b) => b.links.length - a.links.length || a.name.localeCompare(b.name));

console.log(`Parsed ${allLinks.length} total bookmarks.`);
console.log(`Grouped into ${sortedGroups.length} domains.`);

// Save to a data file
const outputDir = 'd:/Documents/Project/glog/src/data';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'bookmarks.json'), JSON.stringify(sortedGroups, null, 2));
