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
	console.log("Team Config:", event.teamConfiguration);
	console.log("Site Config:", event.siteConfiguration);
	console.log("Example Secret from team config:", event.teamConfiguration?.exampleSecret);

	// Access environment variables from process.env
	console.log("SUPERFLOW_EXTENSION_ENABLED:", process.env["SUPERFLOW_EXTENSION_ENABLED"]);

	// Log all environment variables (be careful with secrets in production!)
	console.log("All env vars:", Object.keys(process.env));
});

export { extension };
