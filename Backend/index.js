import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from"cors";
import axios from "axios";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from "express-session";
import env from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
env.config();

const app = express();
const port = 3000;
const saltRounds = 10;

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE1,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect()
  .then(() => console.log('Connected to', process.env.PG_DATABASE1))
  .catch(err => console.error('Connection error', err.stack));

  const db2 = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE2,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db2.connect()
    .then(() => console.log('Connected to', process.env.PG_DATABASE2))
    .catch(err => console.error('Connection error', err.stack));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(express.static("Frontend"));

// app.use(cors());

const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, 'HomePage.html'));
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 * 5 },
}));

const checkAccessCount = (req, res, next) => {
  if (!req.session.accessCount) {
    req.session.accessCount = 0;
  }

  console.log(`Current access count: ${req.session.accessCount}`);

  if (req.session.accessCount >= 3) {
    console.log("Access limit reached");
    req.session.accessCount = 0;
    return res.status(403).send("Access limit reached. You cannot access this page anymore.");
  } else {
    req.session.accessCount += 1;
    console.log(`New access count: ${req.session.accessCount}`);
    next();
  }
};

app.post("/Digilocker_login/Sign_up/index.html", async (req, res) => {
  const fullName = req.body.fullName;
  const gender = req.body.gender;
  const mobile = req.body.mobile;
  const aadhaar = req.body.Aadhaar;
  const pin = req.body.pin;
  const year = parseInt(req.body['dob-year'], 10); 
  const month = parseInt(req.body['dob-month'], 10) - 1; 
  const day = parseInt(req.body['dob-day'], 10);

  const DOB = new Date(year, month, day);
  const newDOB = DOB.toISOString().slice(0, 10);
  
  try {
      console.log('Received form data:', req.body);
      // res.json({ message: 'Form has been submitted!' });

      const checkResult = await db.query("SELECT * FROM voters WHERE aadhaar = $1", [aadhaar]);
      const checkResult2 = await db.query("SELECT * FROM voters WHERE mobile = $1", [mobile]);
      if (checkResult.rows.length > 0) {
        return res.status(500).json({ message: `Account Already exist for ${fullName}` });
      }
      else if (checkResult2.rows.length > 0) {
        return res.status(500).json({ message: `Account Already exist for ${fullName}` });
      } 
      else {
        bcrypt.hash(pin, saltRounds, async (err, hash) => {
          if (err) {
            return res.send({message: `Error hashing password: ${err}`});
          } else {
            console.log("Hashed Password:", hash);
            await db.query(
              "INSERT INTO voters (Full_name, DOB, Gender, mobile, aadhaar, pin) VALUES ($1, $2, $3, $4, $5, $6)",
              [fullName, newDOB, gender, mobile, aadhaar, hash]
            );
            const result = await db.query("SELECT * FROM voters WHERE mobile = $1", [parseInt(mobile)]);;
            req.session.user = result.rows[0]; 
            res.json({ 
              message: 'Form has been submitted!',
              redirectUrl: '/Voter_Info/voterinfo.html',
              user: result.rows[0]
            });
          }
        });
      }
  } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: 'An error occurred while processing the form' });
  }
});

app.post("/Digilocker_login/digilogin.html", async (req, res) => {
  try {
      console.log('Received form data:', req.body);
      let user = null;

      if (req.body.type === "Mobile") {
          const mobile = req.body.mobile;
          const result = await db.query("SELECT * FROM voters WHERE mobile = $1", [parseInt(mobile)]);
          user = result.rows[0];
      } else if (req.body.type === "Username") {
          const username = req.body.username;
          const result = await db.query("SELECT * FROM voters WHERE Full_name = $1", [username]);
          user = result.rows[0];
      } else if (req.body.type === "Aadhaar") {
          const aadhaar = req.body.aadhaar;
          const result = await db.query("SELECT * FROM voters WHERE aadhaar = $1", [aadhaar]);
          user = result.rows[0];
      }

      if (user) {
          const storedHashedPassword = user.pin;
          bcrypt.compare(req.body.pin, storedHashedPassword, async (err, result) => {
              if (err) {
                  return console.error("Error comparing passwords:", err);
              } else {
                  if (result) {
                      const result2 = await db.query("SELECT * FROM voters_details WHERE aadhaar = $1", [user.aadhaar]);
                      if(result2.rows.length == 0){
                        return res.send({ message: "User's voterID not found" });
                      }
                      req.session.user = result2.rows[0]; 
                      res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '../Voter_Info/voterinfo.html',
                          user: result2.rows[0]
                      });
                  } else {
                      return res.send({ message: "Incorrect Pin" });
                  }
              }
          });
      } else {
          return res.send({ message: "User not found" });
      }
  } catch (err) {
      console.log(err);
      res.json({ message: `Something went wrong` });
  }
});

app.post("/Digilocker_login/Voter_Info/VoterInfo.html", async (req, res) => {
  try {
    // const hasVoted = req.session.user.voted;
    // const result = await db.query("SELECT * FROM voters_details WHERE voted = $1", [hasVoted]);
    // if (result.rows.length > 0) {
    //   return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted });
    // }

    const recaptchaResponse = req.body["g-recaptcha-response"];
    if (!recaptchaResponse) {
      return res.status(400).json({ message: "reCAPTCHA is required" });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const response = await axios.post(verificationUrl);
    if (response.data.success) {
      // Continue with the rest of your logic
      console.log(req.session.user);
      const hasVoted = req.session.user.voted;
      const result = await db.query("SELECT * FROM voters_details WHERE voted = $1", [hasVoted]);
      // console.log(hasVoted);
      if (result.rows.length > 0) {
        return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted });
      }
      else{
        return res.json({ message: "Vote now", hasVoted: hasVoted, user: req.session.user});
      }
    } else {
      return res.status(400).json({ message: "Failed reCAPTCHA verification" });
    }

  } catch (err) {
    return res.json({ message: "user's voterID not found or Something went wrong" });
  }
});

app.get("/Digilocker_login/Vote/vote.html", checkAccessCount, (req, res) => {
  console.log(req.session);
  // res.set('Content-Type', 'text/css');
  // res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(frontendPath, 'Vote', 'vote.html'));
});

app.post("/Digilocker_login/Vote/vote.html", async (req, res)=>{
  try{
    console.log('Received form data:', req.body);
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // const result = await db2.query("SELECT * FROM parties WHERE party_name = $1",[req.body.party]);
    // console.log(result.rows[0]);
    const hasVoted = req.session.user.voted;
    // console.log(hasVoted);
    await db.query("UPDATE voters_details SET voted = voted + 1 WHERE voted = $1", [hasVoted]);
    await db2.query("UPDATE parties SET count = count + 1 WHERE party_name = $1",[req.body.party]);
    res.json({message: 'Your vote has been submitted successfully!'});
  }catch(err){
    console.log(err.message);
  }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});













// app.post("/Digilocker_login/Voter_Info/VoterInfo.html", async (req, res)=>{
//   try{
//     // console.log('Received form data:', req.body);
//     const params = new URLSearchParams({
//       secret: '6LdUEfUpAAAAAG0Gq3Qza8fYvtUh0IrxzJvHxoxL',
//       response: req.body['g-recaptcha-response'],
//       remoteip: req.ip,
//     });
//     const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
//       method: "POST",
//       body: params,
//     });

//     const data = await response.json();
//     console.log(data);
//     if (!data.success) {
//       return res.json({ captchaSuccess: false });
//     }

//     // CAPTCHA is successful, now check if user has voted
//     const hasVoted = req.session.user.voted;
//     const result = await db.query("SELECT * FROM voters_details WHERE voted = $1", [hasVoted]);
//     if (result.rows.length > 0) {
//       return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted });
//     }

//     req.session.user = req.body.user;
//     res.json({hasVoted: 0, captchaSuccess: true });
//   } catch (err) {
//     res.json({message: "user's voterID not found or Something went wrong"});
//   }
// });

// app.get("/Digilocker_login/Vote/vote.html", (req, res) => {
//   if (req.session.user) {
//       console.log(req.session.user);
//       res.json(req.session.user);
//   } else {
//       res.status(401).json({ message: "Unauthorized" });
//   }
// });