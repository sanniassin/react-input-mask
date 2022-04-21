const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const srcDir = path.resolve(__dirname, "./dev");

module.exports = {
  devtool: "cheap-module-source-map",
  context: srcDir,
  performance: {
    hints: false,
  },
  entry: "./index.js",
  output: {
    filename: "[name].js",
  },
  resolve: {
    modules: ["node_modules", "."],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    host: "0.0.0.0",
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
    }),
  ],
};
