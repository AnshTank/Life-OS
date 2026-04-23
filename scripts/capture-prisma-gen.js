const { execSync } = require('child_process');
const fs = require('fs');

console.log('Starting prisma generate capture...');
try {
  const output = execSync('npx prisma generate', { encoding: 'utf8', stdio: 'pipe' });
  fs.writeFileSync('prisma-gen-complete.log', output);
  console.log('Prisma generate completed successfully.');
} catch (err) {
  console.error('Prisma generate failed!');
  fs.writeFileSync('prisma-gen-error.log', err.stdout + '\n' + err.stderr);
  console.log('Error details written to prisma-gen-error.log');
}
