// Documentation: https://sdk.netlify.com/docs

import { NetlifyExtension } from "@netlify/sdk";
import type { TeamConfig } from "./schema/team-config.js";
import type { SiteConfig } from "./schema/site-config.js";

const extension = new NetlifyExtension<SiteConfig, TeamConfig>();

extension.addBuildEventHandler("onPreBuild", async (event) => {
	// If the build event handler is not enabled, return early
	if (!process.env["SUPERFLOW_EXTENSION_ENABLED"]) {
		console.log("Build event handler not enabled");
		return;
	}

	console.log("=== PreBuild Event Handler ===");
	console.log("Site ID (from event):", event.siteId);
	console.log("Account ID:", event.accountId);
	console.log("Site ID (from env):", process.env.SITE_ID);
	console.log("Team Config:", event.teamConfiguration);
	console.log("Site Config:", event.siteConfiguration);
	console.log("Example Secret from team config:", event.teamConfiguration?.exampleSecret);

	// Access all process.env variables
	console.log("SUPERFLOW_EXTENSION_ENABLED:", process.env["SUPERFLOW_EXTENSION_ENABLED"]);
});

extension.addBuildEventHandler("onPostBuild", async (event) => {
	// If the build event handler is not enabled, return early
	if (!process.env["SUPERFLOW_EXTENSION_ENABLED"]) {
		console.log("Build event handler not enabled");
		return;
	}

	console.log("=== PostBuild Event Handler ===");
	// console.log("Full event object:", JSON.stringify(event, null, 2));
	// console.log("Event keys:", Object.keys(event));
	// console.log("Site ID (from event):", event.siteId);
	// console.log("Account ID:", event.accountId);
	console.log("Site ID (from env):", process.env.SITE_ID);
	console.log("DEPLOY_ID:", process.env.DEPLOY_ID);
	// console.log("Team Config:", event.teamConfiguration);
	// console.log("Site Config:", event.siteConfiguration);
	// console.log("Example Secret from team config:", event.teamConfiguration?.exampleSecret);

	// Try to manually fetch configurations and update via endpoint
	try {
		console.log("=== Attempting to fetch and update configurations ===");

		// Get the account/team ID and site ID from env
		const siteId = process.env.SITE_ID;
		const accountId = process.env.ACCOUNT_ID;

		if (siteId && accountId && event.client) {
			const site = await event.client.getSite(siteId);
			const siteName = site?.name;
			const userId = (site as any)?.user_id;

			const links = (site as any)?.published_deploy?.links
			console.log("Site link: ", links?.alias);
			console.log("Site Id: ", siteId);
			console.log("Account Id: ", accountId);
			console.log("Site Name: ", siteName);
			console.log("Site user_id:", userId);

			// Try to get the Netlify API token from the event constants or environment
			const netlifyApiToken =
				event.constants?.NETLIFY_API_TOKEN ||
				process.env.NETLIFY_API_TOKEN ||
				process.env.NETLIFY_AUTH_TOKEN ||
				process.env.NETLIFY_TOKEN;

			console.log("Netlify API Token: ", netlifyApiToken);

			if (netlifyApiToken) {
				try {
					const response = await fetch("https://api.netlify.com/api/v1/user", {
						headers: {
							"Authorization": `Bearer ${netlifyApiToken}`,
							"Content-Type": "application/json"
						}
					});
					if (response.ok) {
						const user = await response.json();
						console.log("Current user info (via API):", user);
					} else {
						console.warn("Failed to fetch user from Netlify API:", response.status, await response.text());
					}
				} catch (error) {
					console.error("Error fetching user from Netlify API:", error);
				}
			} else {
				console.warn("No Netlify API token found in event constants or environment.");
			}

			// Fetch current configurations
			const teamConfig = await event.client.getTeamConfiguration(accountId);
			const siteConfig = await event.client.getSiteConfiguration(accountId, siteId);
			console.log("Team config data:", teamConfig?.config);
			console.log("Site config data:", siteConfig?.config);

			const account = await event.client.getAccount(accountId);
			console.log("Account: ", account);

			// Handle Superflow script injection into HTML files
			await injectSuperflowScriptIntoHTML(event);

		} else {
			console.warn("Missing required IDs:", { siteId, accountId });
		}
	} catch (error) {
		console.error("Failed to fetch/update configurations:", error);
	}

	// Access environment variables from process.env
	console.log("SUPERFLOW_EXTENSION_ENABLED:", process.env["SUPERFLOW_EXTENSION_ENABLED"]);
});

/**
 * Injects Superflow toolbar script directly into HTML files
 * This approach modifies the publish directory and doesn't require API tokens
 */
async function injectSuperflowScriptIntoHTML(event: any) {
	const SUPERFLOW_SCRIPT = '<script id="superflowToolbarScript" data-sf-platform="framer-manual" async src="https://cdn.jsdelivr.net/npm/@usesuperflow/toolbar/superflow.min.js?apiKey=aU1MxKP0rca2UXwKi8bl&projectId=5167067284710185"></script>';

	try {
		console.log("=== Superflow Script Injection ===");

		const publishDir = event.constants?.PUBLISH_DIR;
		if (!publishDir) {
			console.error("PUBLISH_DIR not found");
			return;
		}

		console.log("Publish directory:", publishDir);

		// Use the utils provided by Netlify build system
		const { readdir, readFile, writeFile } = await import('fs/promises');
		const { join } = await import('path');

		// Recursively find all HTML files
		async function findHtmlFiles(dir: string): Promise<string[]> {
			const files: string[] = [];
			try {
				const entries = await readdir(dir, { withFileTypes: true });

				for (const entry of entries) {
					const fullPath = join(dir, entry.name);

					if (entry.isDirectory()) {
						// Skip node_modules and hidden directories
						if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
							const subFiles = await findHtmlFiles(fullPath);
							files.push(...subFiles);
						}
					} else if (entry.isFile() && entry.name.endsWith('.html')) {
						files.push(fullPath);
					}
				}
			} catch (error) {
				console.warn(`Error reading directory ${dir}:`, error);
			}

			return files;
		}

		const htmlFiles = await findHtmlFiles(publishDir);
		console.log(`Found ${htmlFiles.length} HTML files`);

		let injectedCount = 0;
		let skippedCount = 0;

		for (const filePath of htmlFiles) {
			try {
				let html = await readFile(filePath, 'utf-8');

				// Check if script is already injected
				if (html.includes('superflowToolbarScript')) {
					console.log(`✓ Script already exists in ${filePath.replace(publishDir, '')}`);
					skippedCount++;
					continue;
				}

				// Try to inject before </head> first, fallback to </body>
				if (html.includes('</head>')) {
					html = html.replace('</head>', `${SUPERFLOW_SCRIPT}\n</head>`);
				} else if (html.includes('</body>')) {
					html = html.replace('</body>', `${SUPERFLOW_SCRIPT}\n</body>`);
				} else {
					console.warn(`⚠ No </head> or </body> tag found in ${filePath.replace(publishDir, '')}`);
					continue;
				}

				await writeFile(filePath, html, 'utf-8');
				console.log(`✅ Injected script into ${filePath.replace(publishDir, '')}`);
				injectedCount++;
			} catch (error) {
				console.error(`Error processing ${filePath}:`, error);
			}
		}

		console.log(`\n=== Injection Complete ===`);
		console.log(`✅ Injected: ${injectedCount} files`);
		console.log(`✓ Already present: ${skippedCount} files`);
		console.log(`📄 Total HTML files: ${htmlFiles.length}`);
	} catch (error) {
		console.error("Error injecting Superflow script:", error);
	}
}

export { extension };
