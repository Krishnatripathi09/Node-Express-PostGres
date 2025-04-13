const express = require("express");
const pool = require("./db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const cookieparser = require("cookie-parser");
app.use(express.json());
app.use(cookieparser());
const PORT = 5000;

app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const userInfo = await pool.query(
      `INSERT INTO "Users"( "firstName","lastName","email","password") VALUES ($1,$2,$3,$4)`,
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
    const userId = user.rows[0].id;
    if (validUser) {
      const token = await jwt.sign({ id: userId }, "MysecrtetKey789", {
        expiresIn: "9h",
      });

      res.cookie("token", token, {
        expires: new Date(Date.now() + 9 * 3600000),
        httpOnly: true,
      });
      res.status(200).send("Logged-In SuccessFully");
    } else {
      res.status(400).send("Invalid Password");
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/user", async (req, res) => {
  const { token } = req.cookies;

  const decodedMsg = await jwt.verify(token, "MysecrtetKey789");
  const { id } = decodedMsg;

  const user = await pool.query(
    `select "firstName","lastName","email" from "Users"  where id = $1`,
    [id]
  );
  res.status(200).send(user.rows[0]);
});



app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
