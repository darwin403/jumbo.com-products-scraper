# What does this script do?

This script `scrape.js` scrapes for all products available on [Jumbo.com](https://www.jumbo.com/producten/?) and stored locally to `dump.jl`. Each new product entry is dumped as JSON to a new line of `dump.jl`. The dump file would like something like this

```json
{"id":"338402STK","subtitle":null,"title":"Jumbo Halfvolle Melk en Optimel Drinkyoghurt","image":"https://static-images.jumbo.com/product_images/061220191814_338402STK-1_360x360_2.png","inAssortment":true,"isAvailable":true,"link":"/jumbo-halfvolle-melk-en-optimel-drinkyoghurt/338402STK","status":"available","retailSet":true,"brand":"Jumbo","category":"Zuivel, eieren, boter","prices":{"price":239,"promoPrice":null,"pricePerUnit":{"price":230,"unit":"piece"}},"quantityOptions":[{"maxAmount":99,"minAmount":1,"stepAmount":1,"unit":"pieces"}],"primaryBadge":[],"secondaryBadges":[],"promotions":[]}
{"id":"247803STK","subtitle":"250 g","title":"Jumbo Champignons Gesneden 250g","image":"https://static-images.jumbo.com/product_images/180520190544_247803STK-1_360x360_2.png","inAssortment":true,"isAvailable":true,"link":"/jumbo-champignons-gesneden-250g/247803STK","status":"available","retailSet":false,"brand":"Jumbo","category":"Groente","prices":{"price":195,"promoPrice":null,"pricePerUnit":{"price":780,"unit":"kg"}},"quantityOptions":[{"maxAmount":99,"minAmount":1,"stepAmount":1,"unit":"pieces"}],"primaryBadge":[],"secondaryBadges":[],"promotions":[]}
.
.
.
```

Optionally, one can also choose from existing pipelines to save the images locally and save products to Microsoft SQL Server.

# Requirements

One needs to make sure the latest stable version of `nodejs` and `npm` is installed.

# Usage

```bash
git clone git@github.com:skdcodes/freelancer-puppeteer-jumbo.git # clone project
cd freelancer-puppeteer-jumbo # change directory to project
npm install # pip installs required libraries
```

Open the file `scrape.js` and edit the following lines to enable pipelines of your choice.

```js
.
.
const enabledPipelines = {
  products: true,
  images: false,
  SQL: false,
};
.
.
```

If you've enabled the `SQL` pipeline, you will need to configure the database connection details by editing the following lines of `pipelines/sql.js`

```js
.
.
.
module.exports = new MSSQL({
  user: "sa",
  password: "yourStrong(!)Password",
  server: "localhost",
  options: {
    enableArithAbort: false,
  },
});
```

You can now run the script

```bash
node scrape.py
```

Thats it! You will see the scrape progress on your console something similar to:

```bash
.
.
# Fetching cookies ...
# Page: 0 Products found: 25
# File Pipeline: Products saved: 25
# Page: 1 Products found: 25
# File Pipeline: Products saved: 25
# Page: 2 Products found: 25
# File Pipeline: Products saved: 25
.
.
.
```

A dump file `dump.jl` will be created in the same folder as the script. If the Image pipeline is enabled then the images are stored in the `images` folder.

# Features

- Bypasses Bot Detection - Uses [Puppeteer Stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) to evade simple bot detection techniques employed by the server. Passes all public bot [tests](https://bot.sannysoft.com/)!

- Pipelines - Lets you save the products to File System or Microsoft SQL Server

# Notes

- The server is not completely stupid. They employ some bot detection techniques. For instance, images cannot be scraped without a valid browser User-Agent. Similarly, the API endpoint cannot be scraped without browser authorized cookies.
- Arbitrary number of random requests without a User-Agent or Cookies will result in your IP being temporarily blocked.
- It is best to not use concurrency / threading to avoid detection.
- Modification of `pageSize` (default: 25) through API does not work. However changing `offSet` works.
