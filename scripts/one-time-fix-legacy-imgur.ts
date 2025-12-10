import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OBSIDIAN_DIR = join(__dirname, '..', 'src/content/obsidian');

// old format:
// https://i.imgur.com/{slug}.{ext}
// new format:
// https://wrpcd.net/cdn-cgi/image/f=auto,w=1200/https%3A%2F%2Fi.imgur.com%2F{slug}.{ext}


async function getAllMarkdownFiles(dir: string, fileList: string[] = []): Promise<string[]> {
	const files = await readdir(dir);
	
	for (const file of files) {
		const filePath = join(dir, file);
		const fileStat = await stat(filePath);
		
		if (fileStat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
			await getAllMarkdownFiles(filePath, fileList);
		} else if (file.endsWith('.md')) {
			fileList.push(filePath);
		}
	}
	
	return fileList;
}

function convertImgurUrl(oldUrl: string): string {
	// URL encode the original imgur URL
	const encodedUrl = encodeURIComponent(oldUrl);
	return `https://wrpcd.net/cdn-cgi/image/f=auto,w=1200/${encodedUrl}`;
}

function fixImgurUrlsInContent(content: string): string {
	// Match https://i.imgur.com/{slug}.{jpg|png|gif}
	// This will match both markdown image syntax and HTML img tags
	const imgurPattern = /https:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)\.(jpg|png|gif)/g;
	
	return content.replace(imgurPattern, (match) => {
		return convertImgurUrl(match);
	});
}

async function main(): Promise<void> {
	console.log('Finding all markdown files...');
	const markdownFiles = await getAllMarkdownFiles(OBSIDIAN_DIR);
	console.log(`Found ${markdownFiles.length} markdown files`);
	
	let totalFixed = 0;
	
	for (const filePath of markdownFiles) {
		const content = await readFile(filePath, 'utf-8');
		const fixedContent = fixImgurUrlsInContent(content);
		
		if (content !== fixedContent) {
			await writeFile(filePath, fixedContent, 'utf-8');
			totalFixed++;
			const relativePath = relative(OBSIDIAN_DIR, filePath);
			console.log(`Fixed imgur URLs in: ${relativePath}`);
		}
	}
	
	console.log(`\nDone! Fixed imgur URLs in ${totalFixed} files.`);
}

main().catch(console.error);

