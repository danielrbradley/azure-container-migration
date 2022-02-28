import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as operationalinsights from "@pulumi/azure-native/operationalinsights";
import * as storage from "@pulumi/azure-native/storage";
import * as app from "@pulumi/azure-native/app/v20220101preview";

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

///////// Original

// const kubeEnvironment = new web.KubeEnvironment("kubeEnvironment", {
//   resourceGroupName: resourceGroup.name,
//   environmentType: "Managed",
//   appLogsConfiguration: {
//     destination: "log-analytics",
//     logAnalyticsConfiguration: {
//       customerId: workspace.customerId,
//       sharedKey: sharedKeys.primarySharedKey?.apply((k) => k!),
//     },
//   },
// });

// const containerAppSimple = new web.ContainerApp("containerAppSimple", {
//   resourceGroupName: resourceGroup.name,
//   name: "container-app-simple",
//   kubeEnvironmentId: kubeEnvironment.id,
//   configuration: {
//     ingress: {
//       external: true,
//       targetPort: 80,
//     },
//   },
//   template: {
//     containers: [
//       {
//         name: "web",
//         image: "nginx",
//         resources: { cpu: 0.25, memory: "0.5Gi" },
//       },
//     ],
//   },
// });

/////////// Step 1

const kubeEnvironment = new app.ManagedEnvironment(
  "kubeEnvironment",
  {
    resourceGroupName: resourceGroup.name,
    // environmentType: "Managed", // Removed
    appLogsConfiguration: {
      destination: "log-analytics",
      logAnalyticsConfiguration: {
        customerId: workspace.customerId,
        sharedKey: sharedKeys.primarySharedKey?.apply((k) => k!),
      },
    },
  },
  {
    aliases: [
      "urn:pulumi:dev::azure-container-migration::azure-native:web/v20210301:KubeEnvironment::kubeEnvironment",
    ],
    ignoreChanges: ["environmentType"],
    retainOnDelete: true,
  }
);

const containerAppSimple = new app.ContainerApp(
  "containerAppSimple",
  {
    resourceGroupName: resourceGroup.name,
    name: "container-app-simple",
    // kubeEnvironmentId: kubeEnvironment.id,
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
    aliases: [
      "urn:pulumi:dev::azure-container-migration::azure-native:web/v20210301:ContainerApp::containerAppSimple",
    ],
    ignoreChanges: ["kubeEnvironmentId", "managedEnvironmentId"],
    retainOnDelete: true,
  }
);

////////// Step 2

const kubeEnvironmentImported = new app.ManagedEnvironment(
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

const containerAppSimpleImport = new app.ContainerApp(
  "containerAppSimpleImported",
  {
    resourceGroupName: resourceGroup.name,
    name: "container-app-simple",
    managedEnvironmentId: kubeEnvironmentImported.id,
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
