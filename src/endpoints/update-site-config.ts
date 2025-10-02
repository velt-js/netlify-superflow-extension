import { withNetlifySDKContext } from "@netlify/sdk/ui/functions";

export default withNetlifySDKContext(async (req, context) => {
	const { client, accountId, siteId } = context as any;

	console.log("=== Updating site configuration via endpoint ===");
	console.log("Account ID:", accountId);
	console.log("Site ID:", siteId);
	console.log("Client:", client);

	if (!accountId || !siteId) {
		return new Response(JSON.stringify({ error: "Missing accountId or siteId" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		// Get the dummy data from the request body
		const body = await req.json();
		const dummyData = body || {
			siteSpecificString: `Build completed at ${new Date().toISOString()}`,
			siteSpecificSecret: "auto-generated-secret-" + Date.now(),
			siteSpecificBoolean: true,
			siteSpecificNumber: Math.floor(Math.random() * 1000),
		};

		console.log("=== Updating site configuration via endpoint ===");
		console.log("Account ID:", accountId);
		console.log("Site ID:", siteId);
		console.log("Dummy data:", dummyData);

		// Fetch existing configuration
		const existingConfig = await client.getSiteConfiguration(accountId, siteId);

		if (!existingConfig) {
			// Create new site configuration
			await client.createSiteConfiguration(accountId, siteId, dummyData);
			console.log("Created new site configuration");
		} else {
			// Update existing site configuration
			await client.updateSiteConfiguration(accountId, siteId, {
				...(existingConfig?.config || {}),
				...dummyData,
			});
			console.log("Updated existing site configuration");
		}

		// Verify the update
		const updatedConfig = await client.getSiteConfiguration(accountId, siteId);
		console.log("Verified updated config:", updatedConfig?.config);

		return new Response(
			JSON.stringify({
				success: true,
				config: updatedConfig?.config,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Failed to update site configuration:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to update site configuration",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
});

