/* eslint-disable import/no-unresolved */

if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line import/extensions
  module.exports = require("./lib/react-input-mask.production.min.js");
} else {
  // eslint-disable-next-line import/extensions
  module.exports = require("./lib/react-input-mask.development.js");
}
