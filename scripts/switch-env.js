/**
 * Environment Switcher Utility for Asterra Store Multi-App Architecture
 * Usage:
 *   node scripts/switch-env.js dev
 *   node scripts/switch-env.js prod
 */

const fs = require('fs');
const path = require('path');

const targetArg = (process.argv[2] || 'dev').toLowerCase();
const isProd = targetArg === 'prod' || targetArg === 'production';
const targetMode = isProd ? 'production' : 'development';
const sourceFile = isProd ? '.env.production' : '.env.development';

const projects = [
  { name: 'backend', port: '8000', url: isProd ? 'https://api.asterrastore.biz.id' : 'http://localhost:8000' },
  { name: 'frontend-user', port: '3000', url: isProd ? 'https://asterrastore.biz.id' : 'http://localhost:3000' },
  { name: 'frontend-admin', port: '3001', url: isProd ? 'https://admin.asterrastore.biz.id' : 'http://localhost:3001' },
  { name: 'frontend-sales', port: '3002', url: isProd ? 'https://sales.asterrastore.biz.id' : 'http://localhost:3002' },
];

console.log(`\n🔄 Switching Asterra Store ecosystem to: [${targetMode.toUpperCase()}]`);
console.log('='.repeat(70));

let successCount = 0;

for (const project of projects) {
  const projectDir = path.resolve(__dirname, '..', project.name);
  const srcPath = path.join(projectDir, sourceFile);
  const destPath = path.join(projectDir, '.env');

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠️  [${project.name}] Source file missing: ${sourceFile}`);
    continue;
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ [${project.name.padEnd(14)}] Activated ${sourceFile} -> .env (${project.url})`);
    successCount++;
  } catch (err) {
    console.error(`❌ [${project.name}] Failed to copy: ${err.message}`);
  }
}

console.log('='.repeat(70));
if (successCount === projects.length) {
  console.log(`✨ All 4 applications are now configured for ${targetMode.toUpperCase()}!`);
} else {
  console.log(`⚠️  Completed with ${successCount}/${projects.length} updated.`);
}
console.log('');
