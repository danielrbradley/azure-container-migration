import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as operationalinsights from "@pulumi/azure-native/operationalinsights";
import * as app from "@pulumi/azure-native/app";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("resourceGroup");

const resourceGroupName = resourceGroup.name;

const workspace = new operationalinsights.Workspace("workspace", {
  resourceGroupName,
  location: "CentralUS",
});

const sharedKeys = operationalinsights.getSharedKeysOutput({
  resourceGroupName,
  workspaceName: workspace.name,
});

const kubeEnvironment = new app.ManagedEnvironment(
  "kubeEnvironmentImported",
  {
    resourceGroupName: resourceGroup.name,
    name: "kubeEnvironmentc954af07",
    appLogsConfiguration: {
      destination: "log-analytics",
      logAnalyticsConfiguration: {
        customerId: workspace.customerId,
        sharedKey: sharedKeys.primarySharedKey?.apply((k) => k!),
      },
    },
  },
  {
    import:
      "/subscriptions/0282681f-7a9e-424b-80b2-96babd57a8a1/resourceGroups/resourceGroup87d1d5d8/providers/Microsoft.App/managedenvironments/kubeEnvironmentc954af07",
    ignoreChanges: ["appLogsConfiguration.logAnalyticsConfiguration.sharedKey"],
  }
);

const containerAppSimple = new app.ContainerApp(
  "containerAppSimpleImported",
  {
    resourceGroupName: resourceGroup.name,
    name: "container-app-simple",
    managedEnvironmentId: kubeEnvironment.id,
    configuration: {
      ingress: {
        external: true,
        targetPort: 80,
      },
    },
    template: {
      containers: [
        {
          name: "web",
          image: "nginx",
          resources: { cpu: 0.25, memory: "0.5Gi" },
        },
      ],
    },
  },
  {
    import:
      "/subscriptions/0282681f-7a9e-424b-80b2-96babd57a8a1/resourceGroups/resourceGroup87d1d5d8/providers/Microsoft.App/containerApps/container-app-simple",
    ignoreChanges: [
      "configuration.activeRevisionsMode",
      "configuration.ingress.traffic",
      "configuration.ingress.transport",
      "configuration.ingress.allowInsecure",
      "template.scale",
    ],
  }
);

export const containerAppSimpleUrl = pulumi.interpolate`https://${containerAppSimple.configuration.apply(
  (c) => c?.ingress?.fqdn
)}`;
