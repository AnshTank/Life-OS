const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log('Starting Prisma generate...');
  const output = execSync('npx prisma generate', { encoding: 'utf8' });
  fs.writeFileSync('prisma-gen-log.txt', output);
  console.log('Prisma generate completed successfully.');
} catch (error) {
  fs.writeFileSync('prisma-gen-error.txt', error.stdout + '\n' + error.stderr + '\n' + error.message);
  console.error('Prisma generate failed.');
}
