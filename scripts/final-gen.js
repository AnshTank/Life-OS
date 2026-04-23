const { execSync } = require('child_process');
const fs = require('fs');

console.log('Final generate attempt...');
try {
  // Use a shorter timeout to avoid hanging the agent
  const output = execSync('npx prisma generate', { 
    encoding: 'utf8', 
    env: { ...process.env, PRISMA_CLIENT_ENGINE_TYPE: 'binary' },
    timeout: 30000 
  });
  fs.writeFileSync('prisma-final-gen.log', output);
  console.log('SUCCESS: Generated with binary engine.');
} catch (err) {
  fs.writeFileSync('prisma-final-gen-error.log', err.stdout + '\n' + err.stderr);
  console.error('FAILED: See prisma-final-gen-error.log');
}
