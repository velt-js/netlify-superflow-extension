// Documentation: https://sdk.netlify.com/docs

import { NetlifyExtension } from "@netlify/sdk";
import { withNetlifySDKContext } from "@netlify/sdk/ui/functions";
import type { TeamConfig } from "./schema/team-config.js";
import type { SiteConfig } from "./schema/site-config.js";

const extension = new NetlifyExtension<SiteConfig, TeamConfig>();

extension.addBuildEventHandler("onPreBuild", async () => {
	// If the build event handler is not enabled, return early
	if (!process.env["SUPERFLOW_EXTENSION_ENABLED"]) {
		return;
	}
	console.log("Hello there. 2");

	console.log("context", withNetlifySDKContext)

	const context2 = await withNetlifySDKContext(async (req, context) => {
		console.log("context", context)
		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' }
		});
	})
	
	console.log("context2", context2)

	// withNetlifySDKContext(async (req, context) => {
	// 	console.log("Hello there. 3");
	// 	const { accountId, auth, client } = context as any;
	// 	const accountInfo = await client.getAccount(accountId);
	// 	console.log(accountInfo);

	// 	// Get environment variables for the account/team
	// 	const envVars = await client.getEnvironmentVariables({ accountId });
	// 	console.log('Environment Variables:', envVars);

	// 	return new Response(JSON.stringify({ success: true }), {
	// 		headers: { 'Content-Type': 'application/json' }
	// 	});
	// })

});


export { extension };

