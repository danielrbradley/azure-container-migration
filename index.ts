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

const kubeEnvironment = new app.ManagedEnvironment("kubeEnvironment", {
  resourceGroupName: resourceGroup.name,
  name: "kubeEnvironmentc954af07",
  appLogsConfiguration: {
    destination: "log-analytics",
    logAnalyticsConfiguration: {
      customerId: workspace.customerId,
      sharedKey: sharedKeys.primarySharedKey?.apply((k) => k!),
    },
  },
});

const containerAppSimple = new app.ContainerApp("containerAppSimple", {
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
});

export const containerAppSimpleUrl = pulumi.interpolate`https://${containerAppSimple.configuration.apply(
  (c) => c?.ingress?.fqdn
)}`;
