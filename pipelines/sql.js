const sql = require("mssql");
const Promise = require("bluebird");

class MSSQL {
  constructor(config) {
    this.DB_NAME = "jumbo"; // name of database
    this.TABLE_NAME = "products"; // name of the table
    this.config = config; // any config accepted by mssql: https://github.com/tediousjs/node-mssql#configuration-1
  }

  // gives access to this after this.check() is performed
  init() {
    return new Promise(async (resolve, reject) => {
      sql
        .connect(this.config)
        .then(pool => {
          this.pool = pool;
          // connection established. resolve only if checks pass.
          this.check()
            .then(() => {
              resolve(this);
            })
            .catch(error => {
              this.pool.close();
              reject(error);
            });
        })
        .catch(reject);
    });
  }

  // check if required db & tables are created
  check() {
    return new Promise(async (resolve, reject) => {
      try {
        // query used to create db if not exists.
        const CREATE_DB = `
          IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'${this.DB_NAME}')
            CREATE DATABASE [${this.DB_NAME}];
        `;
        // query used to create table if not exists.
        const CREATE_TABLE = `
          USE ${this.DB_NAME}
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${this.TABLE_NAME}' and xtype='U')
            CREATE TABLE ${this.TABLE_NAME}
              ( 
                _id int IDENTITY(1,1) PRIMARY KEY,
                id varchar(255),
                subtitle nvarchar(255),
                title nvarchar(255),
                image varchar(255),
                inAssortment bit,
                isAvailable bit,
                link nvarchar(255),
                status nvarchar(255),
                retailSet bit,
                brand nvarchar(255),
                category nvarchar(255),
                prices nvarchar(max) CONSTRAINT [prices should be formatted as JSON] CHECK (ISJSON(prices)=1),
                quantityOptions nvarchar(max) CONSTRAINT [quantityOptions should be formatted as JSON] CHECK (ISJSON(quantityOptions)=1),
                primaryBadge nvarchar(max) CONSTRAINT [primaryBadge should be formatted as JSON] CHECK (ISJSON(primaryBadge)=1),
                secondaryBadges nvarchar(max) CONSTRAINT [secondaryBadges should be formatted as JSON] CHECK (ISJSON(secondaryBadges)=1),
                promotions nvarchar(max) CONSTRAINT [promotions should be formatted as JSON] CHECK (ISJSON(promotions)=1)
              );
        `;
        await this.pool.query(CREATE_DB);
        await this.pool.query(CREATE_TABLE);
        resolve();
      } catch (error) {
        this.pool.close();
        reject(error);
      }
    });
  }

  // sql query to insert one product document
  insertProduct(product) {
    return this.pool
      .request()
      .input("id", sql.VarChar(255), product.id)
      .input("subtitle", sql.NVarChar(255), product.subtitle)
      .input("title", sql.NVarChar(255), product.title)
      .input("image", sql.VarChar(255), product.image)
      .input("inAssortment", sql.Bit, product.inAssortment)
      .input("isAvailable", sql.Bit, product.isAvailable)
      .input("link", sql.NVarChar(255), product.link)
      .input("status", sql.NVarChar(255), product.status)
      .input("retailSet", sql.Bit, product.retailSet)
      .input("brand", sql.NVarChar(255), product.brand)
      .input("category", sql.NVarChar(255), product.category)
      .input("prices", sql.NVarChar(sql.MAX), JSON.stringify(product.prices))
      .input(
        "quantityOptions",
        sql.NVarChar(sql.MAX),
        JSON.stringify(product.quantityOptions)
      )
      .input(
        "primaryBadge",
        sql.NVarChar(sql.MAX),
        JSON.stringify(product.primaryBadge)
      )
      .input(
        "secondaryBadges",
        sql.NVarChar(sql.MAX),
        JSON.stringify(product.secondaryBadges)
      )
      .input(
        "promotions",
        sql.NVarChar(sql.MAX),
        JSON.stringify(product.promotions)
      ).query(`
          USE ${this.DB_NAME}
          UPDATE products 
          SET 
            subtitle = @subtitle,
            title = @title,
            image = @image,
            inAssortment = @inAssortment,
            isAvailable = @isAvailable,
            link = @link,
            status = @status,
            retailSet = @retailSet,
            brand = @brand,
            category = @category,
            prices = @prices,
            quantityOptions = @quantityOptions,
            primaryBadge = @primaryBadge,
            secondaryBadges = @secondaryBadges,
            promotions = @promotions
          WHERE id=@id
          IF @@ROWCOUNT = 0
            INSERT INTO ${this.TABLE_NAME} 
            ("id","subtitle","title","image", "inAssortment", "isAvailable","link","status","retailSet","brand","category","prices","quantityOptions","primaryBadge","secondaryBadges","promotions")
            VALUES 
            (@id, @subtitle,@title,@image, @inAssortment, @isAvailable, @link, @status, @retailSet, @brand,@category, @prices,@quantityOptions, @primaryBadge, @secondaryBadges, @promotions);
        `);
  }

  // promise that is fulfilled when all the products are inserted
  insert(products = []) {
    return new Promise((resolve, reject) => {
      Promise.map(products, product => {
        return this.insertProduct(product);
      })
        .then(() => {
          resolve();
          this.pool.close();
        })
        .catch(error => {
          reject(error);
          this.pool.close();
        });
    });
  }
}

module.exports = new MSSQL({
  user: "sa", // ms sql username
  password: "yourStrong(!)Password", // ms sql password
  server: "localhost", // ms sql server
  options: {
    enableArithAbort: false, // to prevent deprecation warnings
  },
});
