/* eslint-disable import/no-unresolved */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./lib/react-input-mask.production.min.js");
} else {
  module.exports = require("./lib/react-input-mask.development.js");
}
