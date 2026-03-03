window["sap-ushell-config"] = {
    defaultRenderer: "fiori2",
    bootstrapPlugins: {
        RuntimeAuthoringPlugin: {
            component: "sap.ushell.plugins.rta",
            config: {
                validateAppVersion: false
            }
        }
    },
    applications: {
        "SalesOrderReview-display": {
            title: "Sales Order Attention List",
            description: "Local FLP Sandbox",
            additionalInformation: "SAPUI5.Component=ai.app.so.salesorders",
            applicationType: "URL",
            url: "../"
        },
        "salesorders-display": {
            title: "Sales Order Attention List",
            description: "Local FLP Sandbox",
            additionalInformation: "SAPUI5.Component=ai.app.so.salesorders",
            applicationType: "URL",
            url: "../"
        }
    }
};
