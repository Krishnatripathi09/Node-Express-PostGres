const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "619916",
  host: "localhost",
  database: "practiceDB",
  port: 5432,
});

module.exports = pool;
