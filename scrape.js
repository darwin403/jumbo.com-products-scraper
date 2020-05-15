const fs = require("fs");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const saveProducts = require("./pipelines/file");
const saveImages = require("./pipelines/image");
const saveSQL = require("./pipelines/sql");

// pipelines that will be used after each set of products are scraped
const enabledPipelines = {
  products: true, // whether to save products to dumps.jl
  images: false, // whether to download images for each product scraped
  SQL: false, // whether to save products to Microsoft SQL Server
};

// start the main scraping
async function start({ userAgent = "", cookies = "" }) {
  const maxBadRequests = 3; // the maximum requests after which scraping stops
  let currentBadRequests = 0;
  let page = 740; // the page to start scraping from

  while (currentBadRequests < maxBadRequests && page <= 1000) {
    // fetch products
    const products = await fetch_products({ userAgent, cookies, page });
    const count = products.length;

    // if there is are no products, it is a bad request
    if (count !== 0) {
      currentBadRequests = 0;

      if (enabledPipelines.products) {
        saveProducts(products)
          .then(() => {
            console.log(`File Pipeline: Products saved: ${count}`);
          })
          .catch(error => {
            console.log("Error occurred while saving products!", error);
          });
      }

      if (enabledPipelines.images) {
        saveImages(products)
          .then(() => {
            console.log(`Image Pipeline: Products saved: ${count}`);
          })
          .catch(error => {
            console.log("Error occurred while saving images!", error);
          });
      }

      if (enabledPipelines.SQL) {
        saveSQL
          .init()
          .then(function (conn) {
            conn
              .insert(products)
              .then(() => {
                console.log(`SQL Pipeline: Products saved: ${count}`);
              })
              .catch(error => {
                console.log("Error occurred while saving to SQL!", error);
              });
          })
          .catch(console.log);
      }
    } else {
      currentBadRequests += 1;
    }
    page += 1;
  }

  console.log(
    `No products found in the last ${maxBadRequests} requests. Closing!`
  );
}

// load the default request body to sent. Got from "chrome's network inspector" :)
const postData = require("./postData.json");

// define how to scrape products from one page
async function fetch_products({ userAgent = "", cookies = "", page = 0 }) {
  let products = [];
  try {
    const api = await fetch("https://www.jumbo.com/api/frontstore-api", {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en",
        "cache-control": "no-cache",
        "user-agent": userAgent,
        "content-type": "application/json;charset=UTF-8",
        cookie: cookies,
      },
      body: postData.replace(/\"offSet\":25/g, `\"offSet\":${page * 25}`),
      method: "POST",
    });

    if (api.status === 200) {
      json = await api.json();
      products = json["data"]["searchResult"]["productsResultList"]["products"];
      console.log("Page:", page, "Products found:", products.length);
    } else {
      console.error(
        "Page:",
        page,
        "Request was blocked! Status code:",
        api.status
      );
    }
  } catch (error) {
    console.error("Page:", page, "Fetch failed!");
  }

  return products;
}

// launch puppeteer to gather cookies & user-agent
puppeteer.use(StealthPlugin());
puppeteer
  .launch({ headless: true })
  .then(async browser => {
    console.log("Fetching cookies ...");

    const page = await browser.newPage();
    const userAgent = await browser.userAgent();

    await page.goto("https://www.jumbo.com/producten/?offSet=25&pageSize=25");
    const cookiesRaw = await page.cookies();
    cookies = cookiesRaw
      .map(cookie => {
        return `${cookie.name}=${cookie.value}`;
      })
      .join("; ");

    await browser.close();

    // start scraping with the cookies and user agent.
    start({ cookies, userAgent });
  })
  .catch(() => {
    console.log("Unable to fetch cookies!");
  });
