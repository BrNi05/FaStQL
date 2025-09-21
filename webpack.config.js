const path = require('path');

module.exports = {
  entry: './src/frontend/terminal.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'production',

  performance: {
    hints: false,
  },
};
