#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const distDir = path.join(__dirname, "..", "dist");
const nsDir = path.join(distDir, "ai", "app", "so", "salesorders");

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copyFileIfExists(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        return;
    }
    ensureDir(destDir);
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            copyFileIfExists(srcPath, destPath);
        }
    }
}

function main() {
    if (!fs.existsSync(distDir)) {
        throw new Error(`dist folder not found: ${distDir}`);
    }

    ensureDir(nsDir);

    const filesToMirror = [
        "Component.js",
        "Component-dbg.js",
        "Component.js.map",
        "Component-preload.js",
        "Component-preload.js.map",
        "index.html"
    ];

    for (const fileName of filesToMirror) {
        copyFileIfExists(path.join(distDir, fileName), path.join(nsDir, fileName));
    }

    copyDirRecursive(path.join(distDir, "i18n"), path.join(nsDir, "i18n"));

    const zipPath = path.join(distDir, "salesorders.zip");
    if (fs.existsSync(zipPath)) {
        const escapedDist = distDir.replace(/"/g, '\\"');
        execSync(`cd "${escapedDist}" && zip -rq salesorders.zip ai/app/so/salesorders`, { stdio: "inherit" });
    }

    const componentPath = path.join(nsDir, "Component.js");
    const preloadPath = path.join(nsDir, "Component-preload.js");

    if (!fs.existsSync(componentPath) || !fs.existsSync(preloadPath)) {
        throw new Error("FLP namespace enrichment failed: namespaced component resources missing");
    }

    console.log("FLP namespace enrichment complete:", nsDir);
}

main();
