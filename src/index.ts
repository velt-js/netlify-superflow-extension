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

			// Get current user information
			try {
				// Access the internal NetlifyExtensionClient which has getCurrentUser()
				const internalClient = (event.client as any).client;
				if (internalClient && typeof internalClient.getCurrentUser === 'function') {
					const user = await internalClient.getCurrentUser();
					console.log("Current user email:", user?.email);
					console.log("Current user info:", user);
				} else {
					console.warn("getCurrentUser not available on internal client");
				}
			} catch (error) {
				console.error("Failed to get current user:", error);
			}

			// Fetch current configurations
			const teamConfig = await event.client.getTeamConfiguration(accountId);
			const siteConfig = await event.client.getSiteConfiguration(accountId, siteId);
			console.log("Team config data:", teamConfig?.config);
			console.log("Site config data:", siteConfig?.config);

			const account = await event.client.getAccount(accountId);
			console.log("Account: ", account);


		} else {
			console.warn("Missing required IDs:", { siteId, accountId });
		}
	} catch (error) {
		console.error("Failed to fetch/update configurations:", error);
	}

	// Access environment variables from process.env
	console.log("SUPERFLOW_EXTENSION_ENABLED:", process.env["SUPERFLOW_EXTENSION_ENABLED"]);
});

export { extension };
