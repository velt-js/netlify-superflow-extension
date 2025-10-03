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

			// Handle persistent Superflow script injection
			await injectSuperflowScript(siteId, netlifyApiToken);

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
 * Injects Superflow toolbar script using Netlify Snippets API
 * This persists across builds and doesn't need to run on every request
 */
async function injectSuperflowScript(
	siteId: string,
	apiToken: string | undefined
) {
	if (!apiToken) {
		console.log("No API token available for Superflow script injection");
		return;
	}

	const SNIPPET_TITLE = "superflow-toolbar-script";
	const SUPERFLOW_SCRIPT = '<script id="superflowToolbarScript" data-sf-platform="framer-manual" async src="https://cdn.jsdelivr.net/npm/@usesuperflow/toolbar/superflow.min.js?apiKey=aU1MxKP0rca2UXwKi8bl&projectId=5167067284710185"></script>';
	const POSITION = "head";

	try {
		console.log("=== Superflow Script Injection ===");

		// Check if snippet already exists
		const snippetsResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/snippets`, {
			headers: {
				"Authorization": `Bearer ${apiToken}`,
				"Content-Type": "application/json"
			}
		});

		if (!snippetsResponse.ok) {
			throw new Error(`Failed to fetch snippets: ${snippetsResponse.status}`);
		}

		const snippetList = await snippetsResponse.json() as Array<{ id: string; title: string; general: string; general_position: string }>;
		const existingSnippet = snippetList.find((s) => s.title === SNIPPET_TITLE);

		if (existingSnippet) {
			// Check if the snippet needs updating
			const needsUpdate = existingSnippet.general !== SUPERFLOW_SCRIPT ||
				existingSnippet.general_position !== POSITION;

			if (needsUpdate) {
				// Update existing snippet
				const updateResponse = await fetch(
					`https://api.netlify.com/api/v1/sites/${siteId}/snippets/${existingSnippet.id}`,
					{
						method: "PUT",
						headers: {
							"Authorization": `Bearer ${apiToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							title: SNIPPET_TITLE,
							general: SUPERFLOW_SCRIPT,
							general_position: POSITION,
						}),
					}
				);

				if (updateResponse.ok) {
					console.log("✅ Superflow script snippet updated successfully");
				} else {
					console.error("Failed to update Superflow snippet:", updateResponse.status, await updateResponse.text());
				}
			} else {
				console.log("✅ Superflow script snippet already exists and is up to date");
			}
		} else {
			// Create new snippet
			const createResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/snippets`, {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${apiToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: SNIPPET_TITLE,
					general: SUPERFLOW_SCRIPT,
					general_position: POSITION,
				}),
			});

			if (createResponse.ok) {
				console.log("✅ Superflow script snippet created successfully");
			} else {
				console.error("Failed to create Superflow snippet:", createResponse.status, await createResponse.text());
			}
		}
	} catch (error) {
		console.error("Error injecting Superflow script:", error);
	}
}

export { extension };
