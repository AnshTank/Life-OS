const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'prisma.config.ts');
const backup = path.join(__dirname, '..', 'prisma.config.ts.BACKUP');

console.log(`Attempting to rename ${target} to ${backup}...`);

try {
  if (fs.existsSync(target)) {
    fs.renameSync(target, backup);
    console.log('SUCCESS: Renamed via Node.');
  } else {
    console.log('File does not exist.');
  }
} catch (err) {
  console.error('FAILED: ' + err.message);
  if (err.code === 'EBUSY') {
    console.error('File is locked by another process.');
  }
}
