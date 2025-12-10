import type { RehypePlugin } from '@astrojs/markdown-remark';
import type { Root } from 'hast';

/**
 * Rehype plugin to add a permalink to farcaster.xyz at the top of each page
 * The permalink uses the same path structure but points to farcaster.xyz
 */
export function rehypePermalink(): ReturnType<RehypePlugin> {
	return (tree: Root, file) => {
		// Get the pathname from the file
		// VFile stores path in file.path or file.history[0]
		const filePath = file.path || file.history?.[0] || '';
		
		// Extract the path after /obsidian/ (username/filename)
		// Example: /obsidian/phil/20230102-215605-57e8b966 -> phil/20230102-215605-57e8b966
		let obsidianPath = '';
		
		// Try to extract from the file path
		const obsidianMatch = filePath.match(/obsidian[\/\\](.+?)(?:\.md)?$/);
		if (obsidianMatch) {
			obsidianPath = obsidianMatch[1].replace(/\\/g, '/'); // Normalize Windows paths
		}
		
		// Replace yyyymmdd-hhmmss- with 0x
		// Example: phil/20230102-215605-57e8b966 -> phil/0x57e8b966
		const strippedObsidianPath = obsidianPath
			.replace(/_users_\//, '')
			.replace(/\/\d{8}-\d{6}-/, '/0x');
		
		// Generate permalink URL
		const permalink = strippedObsidianPath 
			? `https://farcaster.xyz/${strippedObsidianPath}`
			: '#';
		
		const permalinkNode = {
			type: 'element' as const,
			tagName: 'div',
			properties: {
				style: 'margin-bottom: 1rem; padding: 0.75rem; background: #f0f0f0; border-radius: 0.5rem;',
			},
			children: [
				{
					type: 'element' as const,
					tagName: 'a',
					properties: {
						href: permalink,
						style: 'color: #0066cc; text-decoration: none;',
					},
					children: [
						{
							type: 'text' as const,
							value: '🔗 permalink',
						},
					],
				},
			],
		};
		
		// Insert at the end of the tree
		if (tree.children) {
			tree.children.push(permalinkNode);
		}
	};
}

