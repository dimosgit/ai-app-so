#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appRoot = path.join(root, "app", "salesorders");
const webappRoot = path.join(appRoot, "webapp");

const checks = [];

function addCheck(name, ok, details, hint) {
    checks.push({ name, ok, details, hint });
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function run() {
    const manifestPath = path.join(webappRoot, "manifest.json");
    const componentPath = path.join(webappRoot, "Component.js");
    const uiPackagePath = path.join(appRoot, "package.json");
    const mtaPath = path.join(root, "mta.yaml");

    addCheck("manifest exists", fileExists(manifestPath), manifestPath, "Create or restore webapp/manifest.json");
    addCheck("Component exists", fileExists(componentPath), componentPath, "Create or restore webapp/Component.js");
    addCheck("UI module package exists", fileExists(uiPackagePath), uiPackagePath, "Create or restore app/salesorders/package.json");
    addCheck("mta exists", fileExists(mtaPath), mtaPath, "Create or restore mta.yaml");

    if (!checks.every((check) => check.ok)) {
        return finish();
    }

    const manifest = readJson(manifestPath);
    const componentJs = readText(componentPath);
    const uiPackage = readJson(uiPackagePath);
    const mtaYaml = readText(mtaPath);

    const appId = manifest?.["sap.app"]?.id;
    const appVersion = manifest?.["sap.app"]?.applicationVersion?.version;
    const crossNavigationInbounds = manifest?.["sap.app"]?.crossNavigation?.inbounds;
    const cloudService = manifest?.["sap.cloud"]?.service;
    const resourceRoots = manifest?.["sap.ui5"]?.resourceRoots || {};
    const i18nBundleName = manifest?.["sap.ui5"]?.models?.i18n?.settings?.bundleName;

    addCheck("sap.app.id configured", typeof appId === "string" && appId.length > 0, `sap.app.id=${appId || "<missing>"}`, "Set sap.app.id in manifest.json");

    const componentMatch = componentJs.match(/Component\.extend\("([^"]+)"/);
    const componentNamespace = componentMatch?.[1];
    const expectedComponentNamespace = appId ? `${appId}.Component` : "<unknown>.Component";

    addCheck(
        "Component namespace matches sap.app.id",
        Boolean(componentNamespace && appId && componentNamespace === expectedComponentNamespace),
        `Component.extend(${componentNamespace || "<missing>"}) expected ${expectedComponentNamespace}`,
        "Align Component.extend namespace with sap.app.id + '.Component'"
    );

    addCheck(
        "resourceRoots contains app namespace",
        Boolean(appId && resourceRoots[appId] === "./"),
        `resourceRoots[${appId || "<missing>"}]=${appId ? resourceRoots[appId] : "<n/a>"}`,
        "Set sap.ui5.resourceRoots.<sap.app.id> to './'"
    );

    addCheck(
        "i18n bundleName matches app namespace",
        Boolean(appId && i18nBundleName === `${appId}.i18n.i18n`),
        `bundleName=${i18nBundleName || "<missing>"}`,
        "Set sap.ui5.models.i18n.settings.bundleName to <sap.app.id>.i18n.i18n"
    );

    const hasInbounds = Boolean(crossNavigationInbounds && Object.keys(crossNavigationInbounds).length > 0);
    addCheck(
        "crossNavigation inbounds configured",
        hasInbounds,
        hasInbounds ? `inbounds=${Object.keys(crossNavigationInbounds).join(",")}` : "inbounds=<missing>",
        "Define sap.app.crossNavigation.inbounds for Work Zone tile intent"
    );

    addCheck(
        "sap.cloud.service configured",
        typeof cloudService === "string" && cloudService.length > 0,
        `sap.cloud.service=${cloudService || "<missing>"}`,
        "Set sap.cloud.service and keep it aligned with destination entries"
    );

    addCheck(
        "UI package version matches manifest version",
        Boolean(appVersion && uiPackage.version === appVersion),
        `manifest=${appVersion || "<missing>"}, app/salesorders/package.json=${uiPackage.version || "<missing>"}`,
        "Keep versions in sync so HTML5 app updates are easy to verify"
    );

    addCheck(
        "mta has html5 repo host destination with sap.cloud.service",
        mtaYaml.includes("Name: ai-app-so-html5-repo-host") && mtaYaml.includes("sap.cloud.service: ai.app.so"),
        "Looked for ai-app-so-html5-repo-host + sap.cloud.service: ai.app.so",
        "Ensure destination content provides html5 host destination for discovery"
    );

    const hasSubaccountSrvApi = /subaccount:\s*[\s\S]*Name:\s*ai-app-so-srv-api[\s\S]*HTML5\.DynamicDestination:\s*true/.test(mtaYaml);
    addCheck(
        "mta has subaccount srv-api dynamic destination",
        hasSubaccountSrvApi,
        "Looked for subaccount destination ai-app-so-srv-api with HTML5.DynamicDestination: true",
        "Add ai-app-so-srv-api under destination service init_data.subaccount"
    );

    const distZip = path.join(appRoot, "dist", "salesorders.zip");
    if (fileExists(distZip)) {
        addCheck("built artifact exists", true, distZip, "");
    } else {
        addCheck(
            "built artifact exists",
            false,
            `${distZip} missing`,
            "Run: npm --prefix app/salesorders run build:cf"
        );
    }

    finish();
}

function finish() {
    const failed = checks.filter((check) => !check.ok);
    const passed = checks.filter((check) => check.ok);

    console.log("\nPre-deploy smoke check\n");

    for (const check of passed) {
        console.log(`✅ ${check.name} — ${check.details}`);
    }

    for (const check of failed) {
        console.log(`❌ ${check.name} — ${check.details}`);
        if (check.hint) {
            console.log(`   ↳ Fix: ${check.hint}`);
        }
    }

    console.log(`\nResult: ${passed.length} passed, ${failed.length} failed\n`);

    if (failed.length > 0) {
        process.exit(1);
    }
}

run();
