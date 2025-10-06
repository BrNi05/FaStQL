const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

const dir = __dirname;

const pkg = JSON.parse(readFileSync(path.join(dir, '../package.json'), 'utf-8'));
const { version } = pkg;

const tags = ['brni05/fastql:latest', `brni05/fastql:${version}`];

execSync('docker buildx create --use || true', { stdio: 'inherit' });

console.log('Building Docker image with tags: ', tags.join(', '));

execSync(
  `docker buildx build --platform linux/amd64,linux/arm64 ${tags.map(t => '-t ' + t).join(' ')} --push .`,
  { stdio: 'inherit' }
);

console.log('Multi-platform build & push done.');