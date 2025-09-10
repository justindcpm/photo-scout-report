const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Desktop App...\n');

try {
  // Step 1: Build the web app
  console.log('📦 Building web application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Step 2: Build the desktop app
  console.log('\n🔧 Building desktop application...');
  execSync('electron-builder --config electron-builder.json', { stdio: 'inherit' });
  
  console.log('\n✅ Desktop app built successfully!');
  console.log('📁 Check the "dist-electron" folder for your installer.');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}