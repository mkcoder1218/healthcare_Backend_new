require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "hairsalon_dev",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "postgres", // must be explicitly set
  },
  test: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME ? process.env.DB_NAME + "_test" : "hairsalon_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "postgres",
  },
  production: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "hairsalon_prod",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "postgres",
  },
};
