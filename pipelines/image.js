const fs = require("fs");
const request = require("request");
const path = require("path");
const url = require("url");
var Promise = require("bluebird");

var folder = path.resolve("images");

// create images folder if does not exist
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
}

// user agent required since server declines requests otherwise
const userAgent =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

// generic file download function
function download(uri, fileName = "") {
  return new Promise(function (resolve, reject) {
    request.head(uri, function (error, response, body) {
      if (error) return reject(error);

      const parsed = url.parse(uri);
      const filename = path.join(
        folder,
        fileName || path.basename(parsed.pathname)
      );

      request({
        url: uri,
        headers: {
          "User-Agent": userAgent,
        },
      })
        .pipe(fs.createWriteStream(filename))
        .on("close", resolve);
    });
  });
}

// promise function fulfilled when all images are saved.
function saveImages(products = []) {
  return Promise.map(
    products,
    function (product) {
      return download(product["image"], product["id"] + ".png");
    },
    {
      concurrency: 25, // maximum number of concurrent download, keep this low to prevent suspicion
    }
  );
}

module.exports = saveImages;
