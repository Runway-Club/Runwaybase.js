const path = require("path");
module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "runwaybase-bundle.js",
    path: path.resolve(__dirname, "dist"),
    library: "runwaybase", // Important
    libraryTarget: "umd", // Important
    umdNamedDefine: true, // Important
  },
  resolve: {
    extensions: [".webpack.js", ".web.js", ".ts", ".js"],
  },
  module: {
    rules: [{ test: /\.ts$/, loader: "ts-loader" }],
  },
};
