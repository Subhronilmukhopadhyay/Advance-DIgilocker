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
import https from "https";

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

const checkAccessCount = async (req, res, next) => {
  try{
    // console.log(req.session);
    const result = await db.query("SELECT accesscount FROM login_status WHERE user_id = $1", [req.session.user.voter_id]);
    console.log(result.rows[0]);
    const loginType = result.rows[0].accesscount;
    if (loginType == 0) {
      req.session.user.accessCount = 0;
    } else{
      req.session.user.accessCount = loginType;
    }
    console.log(`Current access count: ${req.session.user.accessCount}`);
  
    if (req.session.user.accessCount >= 3) {
      console.log("Access limit reached");
      req.session.user.accessCount = 0;
      await db.query("UPDATE login_status SET accesscount = $2 WHERE user_id = $1", [req.session.user.voter_id, req.session.user.accessCount]);
      return res.status(403).send("Access limit reached. You cannot access this page anymore.");
    } else {
      req.session.user.accessCount += 1;
      await db.query("UPDATE login_status SET accesscount = $2 WHERE user_id = $1", [req.session.user.voter_id, req.session.user.accessCount]);
      console.log(`New access count: ${req.session.user.accessCount}`);
      next();
    }
  }catch(err){
    console.log(err.message);
  }
  
};

// const checkUserLoginStatus = async (req, res, next) => {
//   const user = req.session.user;
//   console.log(user);
//   if (user) {
//     const result = await db.query("SELECT login_type FROM login_status WHERE user_id = $1", [user.id]);
//     console.log(user);
//     if (result.rows.length > 0) {
//       const loginType = result.rows[0].login_type;
//       if (loginType && loginType !== req.body.loginType) {
//         return res.status(403).json({ message: "User already logged in with another method" });
//       }
//     }
//   }
//   next();
// };

// const checkUserLoginStatus2 = async (req, res, next) => {
//   const user = req.session.user;
//   let user2 = null;
//   console.log(user);
//   if (user.type === "Mobile") {
//       const mobile = user.mobile;
//       const result = await db.query("SELECT * FROM voters WHERE mobile = $1", [parseInt(mobile)]);
//       user2 = result.rows[0];
//   } else if (user.type === "Username") {
//       const username = user.username;
//       const result = await db.query("SELECT * FROM voters WHERE Full_name = $1", [username]);
//       user2 = result.rows[0];
//   } else if (user.type === "Aadhaar") {
//       const aadhaar = user.aadhaar;
//       const result = await db.query("SELECT * FROM voters WHERE aadhaar = $1", [aadhaar]);
//       user2 = result.rows[0];
//   }

//   if (user2) {
//     const result1 = await db.query("SELECT voter_id FROM voters_details WHERE user_id = $1", [user2.id]);
//     const result = await db.query("SELECT login_type FROM login_status WHERE user_id = $1", [result1.rows[0].voter_id]);
//     console.log(user2);
//     console.log(result);
//     if (result.rows.length > 0) {
//       const loginType = result.rows[0].login_type;
//       if (loginType && loginType !== req.body.loginType) {
//         return res.status(403).json({ message: "User already logged in with another method" });
//       }
//     }
//   }
//   next();
// };

const checkUserLoginStatus = async (userId) => {
  try {
    // console.log(userId);
    const result = await db.query(
      "SELECT login_type FROM login_status WHERE user_id = $1", [userId]
    );
    console.log(result.rows[0].login_type);
    return result.rows[0].login_type != null;
  } catch (error) {
    console.error("Error checking user login status:", error);
    return false;
  }
};

const updateUserLoginStatus = async (userId, loginType) => {
  await db.query(
    "INSERT INTO login_status (user_id, login_type) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET login_type = $2",
    [userId, loginType]
  );
};

const clearUserLoginStatus = async (userId, accessCount) => {
  await db.query("UPDATE login_status SET login_type = NULL WHERE user_id = $1", [userId]);
  await db.query("UPDATE login_status SET login_type = $2 WHERE user_id = $1", [userId, accessCount]);
};

// const checkActiveSession = (req, res, next) => {
//   if (req.session.user && req.session.user.loginType) {
//     return res.status(403).json({ message: "User already logged in" });
//   }
//   next();
// };

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
      // console.log('Received form data:', req.body);
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

                      const isLoggedIn = await checkUserLoginStatus(result2.rows[0].voter_id);
                      // console.log(isLoggedIn);
                      if (isLoggedIn) {
                        return res.send({ message: "User Already logged in!" });
                      }

                      if(result2.rows.length == 0){
                        return res.send({ message: "User's voterID not found" });
                      }
                      await updateUserLoginStatus(result2.rows[0].voter_id, 'Digilocker');
                      req.session.user = {...result2.rows[0] , loginType: 'Digilocker'}; 
                      res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '../Voter_Info/voterinfo.html',
                          user: {...result2.rows[0], loginType: 'Digilocker',}
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

app.post('/virtual_election/voter_login', async (req, res) => {
  const { epicno, phone } = req.body;
  try {
    const isLoggedIn = await checkUserLoginStatus(epicno);
    // console.log(isLoggedIn);
    if (isLoggedIn) {
      return res.send({ message: "User Already logged in!" });
    }
    const result = await db.query('SELECT * FROM voters_details WHERE voter_id = $1', [epicno]);
    if (result.rows.length > 0) {
      await updateUserLoginStatus(epicno, 'Voter');
      req.session.user = {
        ...result.rows[0],
        loginType: 'voter',
        phone: phone,
      };
      // console.log(req.session.user);
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Invalid Voter ID or phone number' });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});

// Endpoint for OTP verification
app.post('/virtual_election/verify_otp', (req, res) => {
  const user_json_url = req.body.user_json_url;
  https.get(user_json_url, (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      const jsonData = JSON.parse(data);
      const user_phone_number = jsonData.user_phone_number;
      // console.log(user_phone_number);
      // console.log(req.session.user);
      if (req.session.user && req.session.user.phone === user_phone_number) {
        res.json({ success: true, user: {...req.session.user, loginType: 'voter'}, redirectUrl: '../Voter_Info/voterinfo.html' });
      } else {
        res.json({ success: false });
      }
    });
  }).on('error', (err) => {
    console.log('Error: ' + err.message);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  });
});

app.post("/virtual_election/Voter_Info/VoterInfo.html", async (req, res) => {
  try {
    // const hasVoted = req.session.user.voted;
    // const result = await db.query("SELECT * FROM voters_details WHERE voted = $1", [hasVoted]);
    // if (result.rows.length > 0) {
    //   return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted });
    // }
    // console.log(req.body);
    const recaptchaResponse = req.body["g-recaptcha-response"];
    if (!recaptchaResponse) {
      return res.status(400).json({ message: "reCAPTCHA is required" });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const response = await axios.post(verificationUrl);
    if (response.data.success) {
      // Continue with the rest of your logic
      // console.log(req.session.user);
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

app.post("/Digilocker_login/Voter_Info/VoterInfo.html", async (req, res) => {
  try {
    // const hasVoted = req.session.user.voted;
    // const result = await db.query("SELECT * FROM voters_details WHERE voted = $1", [hasVoted]);
    // if (result.rows.length > 0) {
    //   return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted });
    // }
    // console.log(req.body);
    const recaptchaResponse = req.body["g-recaptcha-response"];
    if (!recaptchaResponse) {
      return res.status(400).json({ message: "reCAPTCHA is required" });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const response = await axios.post(verificationUrl);
    if (response.data.success) {
      // Continue with the rest of your logic
      // console.log(req.session.user);
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

app.get("/virtual_election/Vote/vote.html", checkAccessCount, (req, res) => {
  // console.log(req.session);
  res.sendFile(path.join(frontendPath, 'Vote', 'vote.html'));
});

app.get("/Digilocker_login/Vote/vote.html", checkAccessCount, (req, res) => {
  // console.log(req.session);
  // res.set('Content-Type', 'text/css');
  // res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(frontendPath, 'Vote', 'vote.html'));
});

app.post("/virtual_election/Vote/vote.html", async (req, res)=>{
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

app.post("/Digilocker_login/Vote/vote.html", async (req, res)=>{
  try{
    // console.log('Received form data:', req.body);
    // console.log(req.session);
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

app.post('/logout', async (req, res) => {
  const accesscount = req.session.accesscount;
  if (req.session.user) {
    console.log(req.session.user);
    await clearUserLoginStatus(req.session.user.voter_id, accesscount);
  }
  req.session.destroy((err) => {
      if (err) {
          return res.json({ success: false, message: 'Logout failed' });
      }

      // Respond with success
      res.json({ success: true, message: 'Logged out' });
  });
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