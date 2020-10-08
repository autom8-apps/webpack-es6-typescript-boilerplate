const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname) + "/dist",
    library: 'YOUR_LIBRARY_NAME',
    libraryTarget: 'umd'
  },
  devServer: {
    contentBase: './'
  },
  watch: true
};