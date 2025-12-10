import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OBSIDIAN_DIR = join(__dirname, '..', 'src/content/obsidian');
const BASE_URL = '/obsidian';

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

function convertRelativeToAbsolute(filePath: string, relativePath: string): string {
	// Remove the .md extension from the relative path if present
	const targetPath = relativePath.replace(/\.md$/, '');
	
	// Resolve the relative path from the current file's directory
	const fileDir = dirname(filePath);
	const resolvedPath = resolve(fileDir, targetPath);
	
	// Get the path relative to the obsidian root
	const relativeToObsidian = relative(OBSIDIAN_DIR, resolvedPath);
	
	// Convert to absolute URL path (normalize slashes)
	const urlPath = normalize(relativeToObsidian).replace(/\\/g, '/');
	
	// Return the absolute path
	return `${BASE_URL}/${urlPath}`;
}

function fixLinksInContent(content: string, filePath: string): string {
	// Match markdown links with relative paths starting with ../
	// Pattern: [text](../path/to/file.md) or [text](../path/to/file)
	const linkPattern = /\[([^\]]+)\]\((\.\.\/[^)]+)\)/g;
	
	return content.replace(linkPattern, (match, linkText: string, relativePath: string) => {
		try {
			const absolutePath = convertRelativeToAbsolute(filePath, relativePath);
			return `[${linkText}](${absolutePath})`;
		} catch (error) {
			console.error(`Error converting link in ${filePath}: ${match}`, error);
			return match; // Return original if conversion fails
		}
	});
}

async function main(): Promise<void> {
	console.log('Finding all markdown files...');
	const markdownFiles = await getAllMarkdownFiles(OBSIDIAN_DIR);
	console.log(`Found ${markdownFiles.length} markdown files`);
	
	let totalFixed = 0;
	
	for (const filePath of markdownFiles) {
		const content = await readFile(filePath, 'utf-8');
		const fixedContent = fixLinksInContent(content, filePath);
		
		if (content !== fixedContent) {
			await writeFile(filePath, fixedContent, 'utf-8');
			totalFixed++;
			const relativePath = relative(OBSIDIAN_DIR, filePath);
			console.log(`Fixed links in: ${relativePath}`);
		}
	}
	
	console.log(`\nDone! Fixed links in ${totalFixed} files.`);
}

main().catch(console.error);

