# Azure Container App migration test

Test of migration of Azure Container Apps from Microsoft.Web to Microsoft.App namespace.

To run:

1. `npm install`
2. `pulumi up`

# Upgrade Instructions

Pulumi sees this migration as the old resources being removed and the new resources being created. Therefore to replicate the migration in our Pulumi state we're doing two steps:

1. Drop the resources being migrated from being managed by Pulumi.
2. Importing the new migrated resources back into our Pulumi stack

## Preparation

Add the [`retainOnDelete` resource option](https://www.pulumi.com/docs/intro/concepts/resources/options/retainondelete/) to the resources which are going to be migrated.

This option allows us to remove the code for the resources once they've changed namespace without attempting to delete the underlying cloud resources. The resources will only be removed from our Pulumi stack state.

## Migration

Once the cloud resources have been migrated by Microsoft, update your resources (examples below in Typescript but should be approximately the same in any other supported Pulumi language).

1. Update your imports:

   ```typescript
   - import * as web from "@pulumi/azure-native/web";
   + import * as app from "@pulumi/azure-native/app";
   ```

2. Update resource namespaces based on resource update:

   - Update the import namespace.
   - Change `KubeEnvironment` to `ManagedEnvironment`
   - Change the Pulumi ID for the resource

   ```typescript
   - const environment = new web.KubeEnvironment("kubeEnvironment", {
   + const environment = new app.ManagedEnvironment("managedEnvironment", {
   ```

   ```typescript
   - const containerApp = new web.ContainerApp("containerApp", {
   + const containerApp = new app.ContainerApp("containerAppImported", {
   ```

3. Fix arguments which have been renamed e.g.

   ```typescript
   const containerApp = new app.ContainerApp("containerAppImported", {
   -   kubeEnvironmentId: environment.id,
   +   managedEnvironmentId: environment.id,
   ```

4. Add import options for the migrated resources

   - Add the `import` option with the Resource ID for each resource (this can be found in the JSON view in the portal).

   ```typescript
   const kubeEnvironment = new app.ManagedEnvironment(
     "managedEnvironment",
     {
       // args
     },
   +   {
   +     // opts
   +     import:
   +       "/subscriptions/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/resourceGroups/resourceGroupXXXXXXXX/providers/Microsoft.App/managedenvironment+ s/environmentcXXXXXXX",
   +     ignoreChanges: [
   +       "appLogsConfiguration.logAnalyticsConfiguration.sharedKey", // this is a write-only property
   +     ],
   +   }
   );
   const containerApp = new app.ContainerApp(
     "containerAppImported",
     {
       // args
     },
   +   {
   +     // opts
   +     import:
   +       "/subscriptions/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/resourceGroups/resourceGroupXXXXXXXX/providers/Microsoft.App/containerApps/container-app",
   +     ignoreChanges: [ // Default values
   +       "configuration.activeRevisionsMode",
   +       "configuration.ingress.allowInsecure",
   +       "template.scale",
   +     ],
   +   }
   );
   ```

   Tip: if you get a message saying "inputs to import do not match the existing resource" during preview, expand the details to show a diff of what doesn't match. You can fix these import differences by changing your code to match, or adding to the `ignoreChanges` options if it's just a default value.

5. Run a pulumi deployment to complete the import.
6. Remove the `import` and `ignoreChanges` before the next deploy.
7. If you'd like the resources to have their original name, [add an alias](https://www.pulumi.com/docs/intro/concepts/resources/options/aliases/) for the old name (this can be removed again once a deploy has been completed):

   ```typescript
   const containerApp = new app.ContainerApp(
   -   "containerAppImported",
   +   "containerApp",
     {
       // args
     },
   +   {
   +     // opts
   +     alias: [{ name: "containerAppImported" }]
   +   }
   );
   ```
