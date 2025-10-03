import {
	Button,
	Card,
	CardLoader,
	CardTitle,
	Checkbox,
	Form,
	FormField,
	FormFieldSecret,
	SiteConfigurationSurface,
} from "@netlify/sdk/ui/react/components";
import { trpc } from "../trpc";
import { useNetlifySDK } from "@netlify/sdk/ui/react";
import { SiteConfigSchema } from "../../schema/site-config.js";

export const SiteConfiguration = () => {
	const sdk = useNetlifySDK();
	const trpcUtils = trpc.useUtils();

	const buildEventHandlerEnabledForSite =
		trpc.buildEventHandler.status.useQuery();

	const enableBuildEventHandlerForSite =
		trpc.buildEventHandler.enable.useMutation({
			onSuccess: async () => {
				await trpcUtils.buildEventHandler.status.invalidate();
			},
		});

	const disableBuildEventHandlerForSite =
		trpc.buildEventHandler.disable.useMutation({
			onSuccess: async () => {
				await trpcUtils.buildEventHandler.status.invalidate();
			},
		});

	const siteSettingsQuery = trpc.siteSettings.query.useQuery();
	const siteSettingsMutation = trpc.siteSettings.mutate.useMutation({
		onSuccess: async () => {
			console.log("Site settings saved successfully!");
			await trpcUtils.siteSettings.query.invalidate();
		},
		onError: (error) => {
			console.error("Failed to save site settings:", error);
		},
	});

	if (buildEventHandlerEnabledForSite.isLoading || siteSettingsQuery.isLoading) {
		return <CardLoader />;
	}

	// Debug logging
	console.log("Site settings query data:", siteSettingsQuery.data);

	return (
		<SiteConfigurationSurface>
			<Card>
				{buildEventHandlerEnabledForSite.data?.enabled ? (
					<>
						<CardTitle>Disable for site</CardTitle>
						<Button
							className="tw-mt-4"
							loading={disableBuildEventHandlerForSite.isPending}
							onClick={() => disableBuildEventHandlerForSite.mutate()}
							variant="danger"
						>
							Disable
						</Button>
					</>
				) : (
					<>
						<CardTitle>Enable for site</CardTitle>

						<Button
							className="tw-mt-4"
							loading={enableBuildEventHandlerForSite.isPending}
							onClick={() => enableBuildEventHandlerForSite.mutate()}
						>
							Enable
						</Button>
					</>
				)}
			</Card>
			{buildEventHandlerEnabledForSite.data?.enabled && (
				<Card>
					<CardTitle>Site Configuration for {sdk.extension.name}</CardTitle>
					<Form
						defaultValues={
							siteSettingsQuery.data ?? {
								siteSpecificString: "",
								siteSpecificSecret: "",
								siteSpecificBoolean: false,
								siteSpecificNumber: 123,
							}
						}
						schema={SiteConfigSchema}
						onSubmit={siteSettingsMutation.mutateAsync}
					>
						<FormField
							name="siteSpecificString"
							type="text"
							label="Site Specific String"
							helpText="This is a site-specific string value"
						/>
						<FormField
							name="siteSpecificNumber"
							type="number"
							label="Site Specific Number"
							helpText="This is a site-specific number value"
						/>
						<FormFieldSecret
							name="siteSpecificSecret"
							label="Site Specific Secret"
							helpText="This is a site-specific secret value"
						/>
						<Checkbox
							name="siteSpecificBoolean"
							label="Site Specific Boolean"
							helpText="This is a site-specific boolean value"
						/>
					</Form>

					<div className="tw-mt-4 tw-p-4 tw-bg-blue-50 tw-rounded-md">
						<p className="tw-text-sm tw-text-blue-800">
							<strong>Superflow Toolbar:</strong> Automatically injected into all HTML files on every deploy. No configuration needed.
						</p>
					</div>
				</Card>
			)}
		</SiteConfigurationSurface>
	);
};
