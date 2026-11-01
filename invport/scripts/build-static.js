const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, '..', 'api-backup');
const inventoryPageFile = path.join(__dirname, '..', 'src', 'app', 'inventory', 'page.tsx');
const inventoryPageBackup = path.join(__dirname, '..', 'src', 'app', 'inventory', 'page.tsx.backup');
const configFile = path.join(__dirname, '..', 'next.config.ts');
const staticConfigFile = path.join(__dirname, '..', 'next.config.static.ts');
const configBackupFile = path.join(__dirname, '..', 'next.config.original.ts');

console.log('🔄 Preparing for static build...');

try {
  // Backup current config
  if (fs.existsSync(configFile)) {
    fs.copyFileSync(configFile, configBackupFile);
  }

  // Use static config
  if (fs.existsSync(staticConfigFile)) {
    fs.copyFileSync(staticConfigFile, configFile);
    console.log('✅ Static config applied');
  }

  // Backup API routes
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(apiBackupDir)) {
      fs.rmSync(apiBackupDir, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, apiBackupDir);
    console.log('✅ API routes backed up');
  }

  // Keep edit route in place for static export
  // Note: /inventory/edit is a static path and safe to export.

  // Fix inventory page for static export (remove dynamic exports)
  if (fs.existsSync(inventoryPageFile)) {
    fs.copyFileSync(inventoryPageFile, inventoryPageBackup);
    let content = fs.readFileSync(inventoryPageFile, 'utf8');
    // Remove dynamic and revalidate exports
    content = content.replace(/export const dynamic = ['"]force-dynamic['"];?\n?/g, '');
    content = content.replace(/export const revalidate = 0;?\n?/g, '');
    fs.writeFileSync(inventoryPageFile, content);
    console.log('✅ Inventory page prepared for static export');
  }

  // Run Next.js build
  console.log('🏗️  Building static export...');
  execFileSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], { stdio: 'inherit' });
  const accessConfig = path.join(__dirname, '..', 'staticwebapp.config.json');
  const outputConfig = path.join(__dirname, '..', 'out', 'staticwebapp.config.json');
  fs.copyFileSync(accessConfig, outputConfig);
  console.log('✅ Static build complete');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exitCode = 1;
} finally {
  // Restore API routes
  if (fs.existsSync(apiBackupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(apiBackupDir, apiDir);
    console.log('✅ API routes restored');
  }

  // No edit route backup to restore

  // Restore inventory page
  if (fs.existsSync(inventoryPageBackup)) {
    fs.copyFileSync(inventoryPageBackup, inventoryPageFile);
    fs.unlinkSync(inventoryPageBackup);
    console.log('✅ Inventory page restored');
  }

  // Restore original config
  if (fs.existsSync(configBackupFile)) {
    fs.copyFileSync(configBackupFile, configFile);
    fs.unlinkSync(configBackupFile);
    console.log('✅ Original config restored');
  }

  console.log('🎉 Static build process complete');
}