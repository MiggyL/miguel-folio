const fs = require('fs');
const path = require('path');

// After Next.js build, reorganize files to work with /portfolio/ basePath
const outDir = path.join(__dirname, '../out');
const portfolioDir = path.join(outDir, 'portfolio');

// Create /portfolio/ directory
if (!fs.existsSync(portfolioDir)) {
  fs.mkdirSync(portfolioDir, { recursive: true });
}

// Copy all files from out/ to out/portfolio/
const files = fs.readdirSync(outDir);
files.forEach(file => {
  const srcPath = path.join(outDir, file);
  const destPath = path.join(portfolioDir, file);

  // Skip the 'portfolio' directory itself and index.txt
  if (file === 'portfolio' || file === 'index.txt') return;

  // Copy file or directory
  if (fs.statSync(srcPath).isDirectory()) {
    // Copy directory recursively
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    // Copy file
    fs.copyFileSync(srcPath, destPath);
  }
});

console.log('✓ Files organized for /portfolio/ basePath');
