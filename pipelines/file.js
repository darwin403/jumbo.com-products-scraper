const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

// dump location
const location = path.resolve("dump.jl");

// delete old dump file
if (fs.existsSync(location)) fs.unlinkSync(location);

// promise function fulfilled when all products are saved.
function saveProducts(products = []) {
  return Promise.map(products, function (product) {
    return new Promise((resolve, reject) => {
      fs.appendFile(location, JSON.stringify(product) + "\r\n", resolve);
    });
  });
}

module.exports = saveProducts;
