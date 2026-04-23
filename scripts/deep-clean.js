const fs = require('fs');
const path = require('path');

const filesToDelete = [
  'prisma.config.ts',
  'prisma-v.txt',
  'prisma-v-error.txt',
  'prisma-gen-log.txt'
];

const dirsToDelete = [
  '.next',
  'node_modules/.prisma'
];

console.log('--- DEEP CLEANUP START ---');

filesToDelete.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${file}`);
    } catch (err) {
      console.error(`Failed to delete file ${file}: ${err.message}`);
    }
  }
});

dirsToDelete.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to delete directory ${dir}: ${err.message}`);
    }
  }
});

console.log('--- DEEP CLEANUP END ---');
