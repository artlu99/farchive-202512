// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkBreaks from "remark-breaks";
import starlightObsidian, { obsidianSidebarGroup } from "starlight-obsidian";
import starlightSiteGraph from 'starlight-site-graph';
import starlightThemeNova from "starlight-theme-nova";
import { rehypePermalink } from "./src/plugins/rehype-permalink.ts";

// https://astro.build/config
export default defineConfig({
	site: "https://20251201-artlu.farchiver.xyz",
	vite: {
		define: {
			// Polyfill for Node.js 'process' global used by micromatch/picomatch and starlight-site-graph
			'process': JSON.stringify({
				env: {},
				versions: {},
			}),
			'globalThis.process': JSON.stringify({
				env: {},
				versions: {},
			}),
		},
		resolve: {
			alias: {
				// Polyfill for Node.js 'path' module used by micromatch/picomatch
				path: 'path-browserify',
			},
		},
		optimizeDeps: {
			include: ['micromatch', 'path-browserify'],
		},
	},
	markdown: {
		remarkPlugins: [remarkBreaks],
		rehypePlugins: [
			rehypePermalink,
			[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
		],
	},

	integrations: [
		starlight({
			title: "artlu Nano Farchive 202512",
			favicon: "/favicon.ico",
			logo: {
				src: "./public/farcaster-logo.svg",
			},
			plugins: [
				starlightThemeNova(/* options */),
				starlightSiteGraph(),

				// Generate the Obsidian vault pages.
				starlightObsidian({
					vault: "./src/content/obsidian",
					output: "/obsidian",
					sidebar: {
						collapsed: false,
						collapsedFolders: true,
						label: "Casts+Replies",
					},
				}),
			],
			sidebar: [
				// Add the generated sidebar group to the sidebar.
				obsidianSidebarGroup,
			],
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/artlu99/nano-farchiver",
				},
			],
		}),
	],
});
