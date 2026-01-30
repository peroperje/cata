const fs = require('fs');
const path = require('path');

const rootPackagePath = path.join(__dirname, '..', 'package.json');
const extensionPackagePath = path.join(__dirname, '..', 'apps/extension/package.json');
const sharedTypesPackagePath = path.join(__dirname, '..', 'libs/shared-types/package.json');
const manifestPath = path.join(__dirname, '..', 'apps/extension/src/manifest.ts');
const versionTsPath = path.join(__dirname, '..', 'libs/shared-types/src/lib/version.ts');

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
const newVersion = rootPackage.version;

console.log(`Syncing version ${newVersion} to all components...`);

// 1. Update apps/extension/package.json
if (fs.existsSync(extensionPackagePath)) {
    const extPackage = JSON.parse(fs.readFileSync(extensionPackagePath, 'utf8'));
    extPackage.version = newVersion;
    fs.writeFileSync(extensionPackagePath, JSON.stringify(extPackage, null, 4) + '\n');
    console.log(`Updated ${extensionPackagePath}`);
}

// 2. Update libs/shared-types/package.json
if (fs.existsSync(sharedTypesPackagePath)) {
    const stPackage = JSON.parse(fs.readFileSync(sharedTypesPackagePath, 'utf8'));
    stPackage.version = newVersion;
    fs.writeFileSync(sharedTypesPackagePath, JSON.stringify(stPackage, null, 4) + '\n');
    console.log(`Updated ${sharedTypesPackagePath}`);
}

// 3. Update apps/extension/src/manifest.ts
if (fs.existsSync(manifestPath)) {
    let manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifestContent = manifestContent.replace(/version: '.*'/, `version: '${newVersion}'`);
    fs.writeFileSync(manifestPath, manifestContent);
    console.log(`Updated ${manifestPath}`);
}

// 3. Update libs/shared-types/src/lib/version.ts
if (fs.existsSync(versionTsPath)) {
    const versionTsContent = `export const APP_VERSION = '${newVersion}';\n`;
    fs.writeFileSync(versionTsPath, versionTsContent);
    console.log(`Updated ${versionTsPath}`);
}

console.log('Version sync complete!');
