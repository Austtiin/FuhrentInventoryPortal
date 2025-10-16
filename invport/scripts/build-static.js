const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, '..', 'api-backup');
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

  // Run Next.js build
  console.log('🏗️  Building static export...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('✅ Static build complete');

} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Restore API routes
  if (fs.existsSync(apiBackupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true, force: true });
    }
    fs.renameSync(apiBackupDir, apiDir);
    console.log('✅ API routes restored');
  }

  // Restore original config
  if (fs.existsSync(configBackupFile)) {
    fs.copyFileSync(configBackupFile, configFile);
    fs.unlinkSync(configBackupFile);
    console.log('✅ Original config restored');
  }

  console.log('🎉 Static build process complete');
}