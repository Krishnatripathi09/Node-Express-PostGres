const express = require("express");
const pool = require("./db.js");
const app = express();

app.use(express.json());
const PORT = 5000;

app.post("/user", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const userInfo = await pool.query(
      `INSERT INTO "Users"("firstName","lastName","email","password") VALUES ($1,$2,$3,$4)`,
      [firstName, lastName, email, password]
    );

    res
      .status(200)
      .send(`Data Inserted SuccessFully ${firstName},${lastName},${email}`);
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
