const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "619916",
  host: "localhost",
  database: "prismaDB",
  port: 5432,
});

module.exports = pool;
