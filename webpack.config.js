const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

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
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['sql'],
      features: [
        'bracketMatching',
        'clipboard',
        'comment',
        'coreCommands',
        'cursorUndo',
        'find',
        'folding',
        'format',
        'hover',
        'multicursor',
        'smartSelect',
        'suggest',
        'wordOperations',
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false, // Disable extracting comments to a separate file
      }),
    ],
  },
  performance: {
    hints: false,
  },
};
