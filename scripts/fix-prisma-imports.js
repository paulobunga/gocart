const fs = require('fs');
const path = require('path');

const prismaDir = path.join(__dirname, '../app/generated/prisma');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace .js imports with .ts for files in the same directory
  content = content.replace(/from ['"]\.\/([^'"]+)\.js['"]/g, (match, file) => {
    const fullPath = path.join(path.dirname(filePath), `${file}.ts`);
    if (fs.existsSync(fullPath)) {
      return match.replace('.js', '.ts');
    }
    return match;
  });
  
  // Replace .js imports in internal directory
  content = content.replace(/from ['"]\.\/internal\/([^'"]+)\.js['"]/g, (match, file) => {
    const fullPath = path.join(path.dirname(filePath), 'internal', `${file}.ts`);
    if (fs.existsSync(fullPath)) {
      return match.replace('.js', '.ts');
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix client.ts
const clientPath = path.join(prismaDir, 'client.ts');
if (fs.existsSync(clientPath)) {
  fixImports(clientPath);
  console.log('✅ Fixed imports in client.ts');
}

// Fix browser.ts if it exists
const browserPath = path.join(prismaDir, 'browser.ts');
if (fs.existsSync(browserPath)) {
  fixImports(browserPath);
  console.log('✅ Fixed imports in browser.ts');
}

console.log('✅ Prisma imports fixed!');

