const { spawn } = require('child_process');
const net = require('net');

/**
 * Checks if a port is available on both 0.0.0.0 and 127.0.0.1
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      resolve(false);
    });

    // We try to listen on all interfaces to be sure
    server.listen(port, '0.0.0.0', () => {
      server.close(() => {
        // Double check on localhost (common issue on Windows)
        const server2 = net.createServer();
        server2.once('error', () => resolve(false));
        server2.listen(port, '127.0.0.1', () => {
          server2.close(() => {
            resolve(true);
          });
        });
      });
    });
  });
}

/**
 * Finds the first available port starting from startPort.
 */
async function getAvailablePort(startPort) {
  let port = startPort;
  const maxPort = startPort + 20; // Try more ports
  
  while (port < maxPort) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    console.log(`\x1b[33m[Life OS] Port ${port} is occupied, trying ${port + 1}...\x1b[0m`);
    port++;
  }
  return startPort; // Fallback
}

(async () => {
  console.log('\x1b[35m[Life OS] Checking for available port...\x1b[0m');
  
  const defaultPort = parseInt(process.env.PORT || '3000', 10);
  const port = await getAvailablePort(defaultPort);
  
  console.log(`\x1b[32m[Life OS] Success! Using port ${port}\x1b[0m`);
  
  // Cross-platform npx command
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  const child = spawn(command, ['next', 'dev', '-p', port.toString()], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port.toString() } // Force Next.js to respect this port
  });

  child.on('exit', (code) => process.exit(code || 0));
  
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
})();
