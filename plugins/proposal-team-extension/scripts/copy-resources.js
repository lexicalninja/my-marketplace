/**
 * Copies resource files from the source plugin into the extension's resources/ directory.
 * Single source of truth: plugins/proposal-team-plugin/
 * Run automatically via `npm run prebuild`.
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', 'proposal-team-plugin');
const RESOURCES_ROOT = path.resolve(__dirname, '..', 'resources');

const COPIES = [
    { src: 'agents', dest: 'agents' },
    { src: 'templates', dest: 'templates' },
    { src: 'writing-standards.md', dest: 'writing-standards.md' },
];

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Clean and recreate resources/
if (fs.existsSync(RESOURCES_ROOT)) {
    fs.rmSync(RESOURCES_ROOT, { recursive: true });
}
fs.mkdirSync(RESOURCES_ROOT, { recursive: true });

for (const { src, dest } of COPIES) {
    const srcPath = path.join(PLUGIN_ROOT, src);
    const destPath = path.join(RESOURCES_ROOT, dest);

    if (!fs.existsSync(srcPath)) {
        console.warn(`⚠ Source not found: ${srcPath}`);
        continue;
    }

    copyRecursive(srcPath, destPath);
    console.log(`✓ ${src} → resources/${dest}`);
}

console.log('Resources copied from proposal-team-plugin.');
