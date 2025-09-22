const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

const dir = __dirname;

const pkg = JSON.parse(readFileSync(path.join(dir, '../package.json'), 'utf-8'));
const { version } = pkg;

const tags = ['fastql:latest', 'brni05/fastql:latest', `brni05/fastql:${version}`];

console.log('\nBuilding Docker image with tags:', tags.join(', '), '\n');
execSync(`docker build ${tags.map((t) => '-t ' + t).join(' ')} .`, { stdio: 'inherit' });

tags.slice(1).forEach((tag) => {
  console.log('\nPushing Docker tag: ', tag);
  execSync(`docker push ${tag}`, { stdio: 'inherit' });
  console.log('Done pushing tag:', tag);
});
