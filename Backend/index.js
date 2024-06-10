import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";
import cors from"cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const saltRounds = 10;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "VotersLocker",
    password: "Subhronil@1234",
    port: 5432,
  });
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.use(cors());

const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, 'HomePage.html'));
});

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
      if (checkResult.rows.length > 0) {
        return res.status(500).json({ message: `Account Already exist for ${fullName}` });
      } else {
        bcrypt.hash(pin, saltRounds, async (err, hash) => {
          if (err) {
            return res.send({message: `Error hashing password: ${err}`});
          } else {
            console.log("Hashed Password:", hash);
            await db.query(
              "INSERT INTO voters (Full_name, DOB, Gender, mobile, aadhaar, pin) VALUES ($1, $2, $3, $4, $5, $6)",
              [fullName, newDOB, gender, mobile, aadhaar, hash]
            );
            res.json({ 
              message: 'Form has been submitted!',
              redirectUrl: '/Voter_Info/voterinfo.html',
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
    try{
        console.log('Received form data:', req.body);
        if(req.body.type === "Mobile"){
            const mobile = req.body.mobile;
            const pin = req.body.pin;
            const result = await db.query("SELECT * FROM voters WHERE mobile = $1", [parseInt(mobile)]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(pin, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '../Voter_Info/voterinfo.html',
                        });
                      } else {
                        res.send({message: "Incorrect Pin"});
                      }
                    }
                });
            } else {
                res.send({message: "User not found"});
            }
        }

        else if(req.body.type === "Username"){
            const username = req.body.username;
            const pin = req.body.pin;
            const result = await db.query("SELECT * FROM voters WHERE Full_name = $1", [username]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(pin, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '../Voter_Info/voterinfo.html',
                        });
                      } else {
                        res.send({message: "Incorrect Password"});
                      }
                    }
                });
            } else {
                res.send({message: "User not found"});
            }
        }

        else if(req.body.type === "Aadhaar"){
            const aadhaar = req.body.aadhaar;
            const pin = req.body.pin;
            const result = await db.query("SELECT * FROM voters WHERE aadhaar = $1", [aadhaar]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(pin, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '../Voter_Info/voterinfo.html',
                        });
                      } else {
                        res.send({message: "Incorrect Password"});
                      }
                    }
                });
            } else {
                res.send({message: "User not found"});
            }
        }

    }
    catch(err){
        console.log(err);
        res.json({ message: `Something went wrong` });
    }
});

app.post("/Digilocker_login/Voter_Info/VoterInfo.html", async (req, res)=>{
  try{
    // console.log('Received form data:', req.body);
    const params = new URLSearchParams({
      secret: '6LdUEfUpAAAAAG0Gq3Qza8fYvtUh0IrxzJvHxoxL',
      response: req.body['g-recaptcha-response'],
      remoteip: req.ip,
    });
    fetch('https://www.google.com/recaptcha/api/siteverify' ,{
      method: "POST",
      body: params,
    })
    .then(res => res.json())
    .then(data=>{
      if(data.success){
        res.json({captchaSuccess: true});
      } else{
        res.json({captchaSuccess: false});
      }
    })
  }catch(err){
    console.log(err.message);
  }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
