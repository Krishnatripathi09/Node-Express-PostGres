const express = require("express");
const pool = require("./db.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const cookieparser = require("cookie-parser");
const ratelimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
app.use(express.json());
app.use(cookieparser());
const PORT = 5000;

const apiLimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too Many Requests from This IP Please try Again After 15 mins",
  standardHeaders: true,
  legacyheaders: false,
});

app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const userInfo = await pool.query(
      `INSERT INTO "Users"( "firstName","lastName","email","password") VALUES ($1,$2,$3,$4)`,
      [firstName, lastName, email, passwordHash]
    );

    res.status(200).json({
      message: `Data Inserted SuccessFully ${firstName},${lastName},${email}`,
    });
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

app.get("/user", apiLimiter, async (req, res) => {
  const { token } = req.cookies;

  const decodedMsg = await jwt.verify(token, "MysecrtetKey789");
  const { id } = decodedMsg;

  const user = await pool.query(
    `select "firstName","lastName","email" from "Users"  where id = $1`,
    [id]
  );
  res.status(200).send(user.rows[0]);
});

app.get("/admin", async (req, res) => {
  const { token } = req.cookies;

  const decodedMsg = await jwt.verify(token, "MysecrtetKey789");
  const { id } = decodedMsg;
  const page = req.query.page || 1;
  const limit = req.query.limit || 3;
  const skip = (page - 1) * limit;

  const user = await pool.query(
    `select * from "Users" order by id ASC LIMIT $1 OFFSET $2`,
    [limit, skip]
  );
  res.status(200).send(user.rows);
});

app.patch("/user/info", async (req, res) => {
  const { token } = req.cookies;

  const decodedUpdateId = await jwt.verify(token, "MysecrtetKey789");

  const { id } = decodedUpdateId;

  const { firstName, lastName } = req.body;

  const values = [];
  const fields = [];
  let index = 1;

  if (firstName) {
    fields.push(`"firstName"=$${index++}`);
    values.push(firstName);
  }

  if (lastName) {
    fields.push(`"lastName"=$${index++}`);
    values.push(lastName);
  }

  if (fields.length === 0) {
    res.status(400).send("Please Provide fields to be updated");
  }

  values.push(id);

  const query = `Update "Users" SET ${fields.join(", ")} where id=$${index}`;
  const result = await pool.query(query, values);

  res.status(200).send("SueccessFully Updated User Information");
});

app.patch("/user/password", async (req, res) => {
  const { token } = req.cookies;

  const decodedMsgs = await jwt.verify(token, "MysecrtetKey789");

  const { id } = decodedMsgs;

  const { oldPassword, newPassword } = req.body;

  const user = await pool.query(`Select * from "Users" where id=$1`, [id]);
  if (user.rows.length === 0) {
    res.status(404).send("User Not Found");
  }
  const userPWD = user.rows[0].password;
  const validPWD = await bcrypt.compare(oldPassword, userPWD);

  if (!validPWD) {
    res.status(400).send("Please Enter Valid Old Password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await pool.query(
    `Update "Users" Set password =$1 where id=$2`,
    [hashedPassword, id]
  );

  res.status(200).send("Password Updated SuccessFully");
});
app.delete("/user/deleteProfile", async (req, res) => {
  const { token } = req.cookies;

  const decodedMsgs = await jwt.verify(token, "MysecrtetKey789");

  const { id } = decodedMsgs;

  const user = await pool.query(`Select * from "Users" where id=$1`, [id]);
  if (user.rows.length === 0) {
    res.status(404).send("User Not Found");
  }

  const deletedUser = await pool.query(`Delete from  "Users" where id=$1`, [
    id,
  ]);

  res.status(200).send("User Deleted SuccessFully", deletedUser);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/upload", upload.array("file"), (req, res) => {
  try {
    res.send("File Uploaded SuccessFully");
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
