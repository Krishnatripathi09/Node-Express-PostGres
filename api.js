const express = require("express");
const pool = require("./db.js");
const authRouter = express.Router();

authRouter.post("/createuser", async (req, res) => {
  if (!req.body) {
    return res.status(400).send("User Details Required");
  }
  const { firstName, lastName, email, password } = req.body;

  const userData = await pool.query(
    `Insert into "newUser"("firstName","lastName","email","password") VALUES ($1,$2,$3,$4)`,
    [firstName, lastName, email, password]
  );

  res.status(201).json({
    message: `Data Inserted SuccessFully ${firstName},${lastName},${email}`,
  });
});

authRouter.get("/userdata", async (req, res) => {
  const users = await pool.query(`Select * from "newUser"`);

  res.status(200).json({ message: "Found Users :-", users: users.rows[0] });
});

module.exports = {
  authRouter,
};
