const path = require('path');

module.exports = {
  entry: {
    terminal: './src/frontend/terminal.js',
    version: './src/frontend/version.js',
    composer: './src/frontend/composer.js',
    scripter: './src/frontend/scripter.js',
    alert: './src/frontend/alert.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'production',

  performance: {
    hints: false,
  },
};
