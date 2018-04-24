var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var srcDir = path.resolve(__dirname, './dev-example');

module.exports = {
  devtool: 'cheap-module-source-map',
  context: srcDir,
  performance: {
    hints: false
  },
  entry: './index.js',
  output: {
    filename: '[name].js'
  },
  resolve: {
    modules: ['node_modules', '.']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader'
        },
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        enforce: 'post',
        loader: 'es3ify-loader'
      }
    ]
  },
  devServer: {
    host: '0.0.0.0',
    port: 9000,
    disableHostCheck: true
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: (module) => {
        return (module.context && module.context.includes('node_modules'));
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'runtime'
    }),
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ]
};
