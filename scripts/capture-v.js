const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx prisma -v', { encoding: 'utf8' });
  fs.writeFileSync('prisma-v.txt', output);
} catch (err) {
  fs.writeFileSync('prisma-v-error.txt', err.stdout + '\n' + err.stderr);
}
