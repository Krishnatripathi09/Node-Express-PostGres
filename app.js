const express = require("express");
const pool = require("./db.js");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());
const PORT = 5000;

app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const userInfo = await pool.query(
      `INSERT INTO "Users"("firstName","lastName","email","password") VALUES ($1,$2,$3,$4)`,
      [firstName, lastName, email, passwordHash]
    );

    res
      .status(200)
      .send(`Data Inserted SuccessFully ${firstName},${lastName},${email}`);
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(`SELECT * FROM "Users" WHERE email = $1`, [
      email,
    ]);
    if (user.rows.length === 0) {
      res
        .status(400)
        .send("User Not Found With this Email Please Enter Valid Email 🤨");
    }

    const validUser = await bcrypt.compare(password, user.rows[0].password);
    if (validUser) {
      res.status(200).send("Logged-In SuccessFully");
    } else {
      res.status(400).send("Invalid Password");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/user", async (req, res) => {
  try {
    const user = await pool.query(`Select * from "Users"`);
    res.status(200).send(user.rows);
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
