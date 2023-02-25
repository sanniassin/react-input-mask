/* eslint-disable import/no-unresolved */

if (process.env.NODE_ENV === "production") {
  module.exports = require("./lib/react-input-mask.production.min");
} else {
  module.exports = require("./lib/react-input-mask.development");
}
