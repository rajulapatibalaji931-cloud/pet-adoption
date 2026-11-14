const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const runProcess = (name, args) => {
  const child = spawn(npmCmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
};

const server = runProcess('server', ['run', 'dev', '--prefix', 'server']);
const client = runProcess('client', ['run', 'dev', '--prefix', 'client']);

const shutdown = () => {
  server.kill();
  client.kill();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
