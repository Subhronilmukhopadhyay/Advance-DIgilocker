import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import bcrypt from "bcryptjs";
// import bcrypt from "bcrypt";
import axios from "axios";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from "express-session";
import env from "dotenv";
import https from "https";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
env.config();

const app = express();
const port = 3000;
const saltRounds = 10;

const { Pool } = pg;
const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
})
db.connect()
  .then(client => {
    console.log('Connected to', process.env.PG_DATABASE);
    client.release();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });

  db.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    res.redirect('/'); 
  });

// const db = new pg.Client({
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   database: process.env.PG_DATABASE1,
//   password: process.env.PG_PASSWORD,
//   port: process.env.PG_PORT,
// });
// db.connect()
//   .then(() => console.log('Connected to', process.env.PG_DATABASE1))
//   .catch(err => console.error('Connection error', err.stack));

//   const db2 = new pg.Client({
//     user: process.env.PG_USER,
//     host: process.env.PG_HOST,
//     database: process.env.PG_DATABASE2,
//     password: process.env.PG_PASSWORD,
//     port: process.env.PG_PORT,
//   });
//   db2.connect()
//     .then(() => console.log('Connected to', process.env.PG_DATABASE2))
//     .catch(err => console.error('Connection error', err.stack));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(express.static("Frontend"));

// app.use(cors());

const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, 'nationality.html'));
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 * 5 },
}));

const cleanupOnServerReload = async (req) => {
  // Check if there's an active session to clear
  try{
    if (req.session.user) {
        try {
            await clearUserLoginStatus(req.session.user.voter_id);
            console.log(`Cleared session for user ${req.session.user.voter_id}`);
        } catch (error) {
            console.error(`Error clearing session for user ${req.session.user.voter_id}:`, error);
        }
    }
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return;
        }
        console.log('Session destroyed successfully');
    });
  }
  catch(err){
    console.log(err.message);
    return;
  }
};

// Attach cleanup function to process events
process.on('exit', cleanupOnServerReload);
process.on('SIGINT', cleanupOnServerReload);
process.on('SIGTERM', cleanupOnServerReload);

const checkFaceDetection = async (req, res, next) => {
  try {
      const scriptPath = path.resolve(__dirname, 'PROJECT_VOTING_SYSTEM/a.py');
      exec(`python ${scriptPath}`, async (error, stdout, stderr) => {
          if (error) {
              console.error(`exec error: ${error}`);
              await clearUserLoginStatus(req.session.user.voter_id);
              req.session.destroy((e) => {
                if (e) {
                    console.error("Error destroying session:", e);
                }
              });
              return res.status(500).send("Error executing face detection script");
          }

          if (stdout.includes("Face detected")) {
              next();
          } else {
              await clearUserLoginStatus(req.session.user.voter_id);
              req.session.destroy((e) => {
                if (e) {
                    console.error("Error destroying session:", e);
                }
              });
              res.status(403).send("Face not detected. Access denied.");
          }
      });
  } catch (err) {
      console.error(`Caught error: ${err}`);
      res.status(500).send("An unexpected error occurred");
  }
};

const checkAccessCount = async (req, res, next) => {
  try{
    // console.log(req.session);
    const result = await db.query("SELECT accesscount, start_date::date AS start_date, start_time,end_time FROM login_status WHERE user_id = $1", [req.session.user.voter_id]);
    // console.log(result.rows[0]);
    let accessCount = result.rows[0].accesscount;
    // console.log(`Current access count: ${req.session.user.accessCount}`);

    const {start_date, start_time, end_time } = result.rows[0];
    const startDateWithoutTime = start_date.toISOString().split('T')[0];
    // const truncatedDate = result.rows[0].start_date.split('T')[0];
    console.log(startDateWithoutTime);

    const currentDate = new Date();
    // console.log(currentDate);
    // console.log(start_time);
    // console.log(end_time);
    // const slotStartDate = new Date(`${startDateWithoutTime}T${start_time}`);
    // console.log(slotStartDate);
    // const slotEndDate = new Date(`${startDateWithoutTime}T${end_time}`);
    // console.log(slotEndDate);

    // if (currentDate >= slotStartDate && currentDate <= slotEndDate) {
      if (accessCount >= 3) {
        // console.log("Access limit reached");
        accessCount = 0;
        await db.query("UPDATE login_status SET accesscount = $2 WHERE user_id = $1", [req.session.user.voter_id, accessCount]);
        await clearUserLoginStatus(req.session.user.voter_id);
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
            }
            res.status(403).send("Access limit reached. You cannot access this page anymore.");
        });
      } else {
        accessCount += 1;
        await db.query("UPDATE login_status SET accesscount = $2 WHERE user_id = $1", [req.session.user.voter_id, accessCount]);
        // console.log(`New access count: ${req.session.user.accessCount}`);
        next();
      }
  }catch(err){
    if(req.session.user){
      await clearUserLoginStatus(req.session.user.voter_id);
      req.session.destroy((e) => {
        if (e) {
            console.error("Error destroying session:", e);
        }
      });
    }
    console.log(err.message);
  }
};

const checkFaceDetectionDuringVote = async (req, res, next) => {
  try {
      const scriptPath = 'PROJECT_VOTING_SYSTEM\\a.py';
      exec(`python ${scriptPath}`, { timeout: 10000 }, async (error, stdout, stderr) => {
          if (error) {
              if (error.code === 1 || stdout.includes("No face detected")) {
                  console.log("No face detected during voting.");
                  req.faceDetected = false;
                  return res.status(500).json({ message: "Error executing face detection script" });
                  // res.redirect('/');
              } else {
                  console.error(`exec error: ${error}`);
                  await clearUserLoginStatus(req.session.user.voter_id);
                  req.session.destroy((e) => {
                      if (e) {
                          console.error("Error destroying session:", e);
                      }
                  });
                  return res.status(500).json({ message: "Error executing face detection script" });
              }
          } else {
              if (stdout.includes("Face detected")) {
                  req.faceDetected = true;
              } else {
                  req.faceDetected = false;
              }
              next();
          }
      });
  } catch (err) {
      console.error(`Caught error: ${err}`);
      await clearUserLoginStatus(req.session.user.voter_id);
      req.session.destroy((e) => {
          if (e) {
              console.error("Error destroying session:", e);
          }
      });
      res.status(500).json({ message: "An unexpected error occurred" });
  }
};

const checkUserLoginStatus = async (userId) => {
  try {
    // console.log(userId);
    const result = await db.query(
      "SELECT login_type FROM login_status WHERE user_id = $1", [userId]
    );
    // console.log(result.rows[0].login_type);
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

const clearUserLoginStatus = async (userId) => {
  await db.query("UPDATE login_status SET login_type = NULL WHERE user_id = $1", [userId]);
};

const runPythonScript = () => {
  // Define input data (example)
  const num_constituencies = 3; // Replace with actual number
  const num_parties = 4; // Replace with actual number
  const constituencies = ['Const1', 'Const2', 'Const3']; // Replace with actual names
  const parties = ['PartyA', 'PartyB', 'PartyC', 'PartyD']; // Replace with actual names
  const votes = {
      'Const1': { 'PartyA': 100, 'PartyB': 120, 'PartyC': 80, 'PartyD': 90 },
      'Const2': { 'PartyA': 110, 'PartyB': 90, 'PartyC': 100, 'PartyD': 95 },
      'Const3': { 'PartyA': 95, 'PartyB': 85, 'PartyC': 110, 'PartyD': 105 }
  }; // Replace with actual votes

  // Prepare input data to send to Python script
  const inputData = {
      num_constituencies,
      num_parties,
      constituencies,
      parties,
      votes
  };

  // Construct command to execute Python script
  const pythonScriptPath = 'PROJECT_VOTING_SYSTEM\\a.py'; // Replace with actual path
  const command = `python ${pythonScriptPath} ${JSON.stringify(inputData)}`;

  // Execute Python script
  exec(command, (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`);
          return;
      }
      console.log(`Python script output: ${stdout}`);

      // Parse Python script output (assuming it returns the winning party or coalition)
      const result = stdout.trim(); // Example: "PartyA forms the government with 2 seats"

      // Handle the result accordingly in your Node.js application
      console.log(`Result from Python script: ${result}`);
  });
};

const checkFaceDetection2 = async (req, res, next) => {
  if (!req.session.faceDetected) {
    const result = await db.query("SELECT accesscount FROM login_status WHERE user_id = $1", [req.session.user.voter_id]);
    let accessCount = result.rows[0].accesscount;
    // console.log(accessCount);
    await db.query("UPDATE login_status SET accesscount = $2 WHERE user_id = $1", [req.session.user.voter_id, accessCount-1]);
    return res.redirect('/face-detection');
  }
  next();
}

app.get('/face-detection', (req, res) => {
  // res.sendFile(path.join(frontendPath, 'Voter_Info', 'VoterInfo.html'));
  res.sendFile(path.join(frontendPath, 'Face_Detection_javaScript' ,'index2.html'));
});

app.get('/face-detection-success', (req, res) => {
  req.session.faceDetected = true;
  res.redirect('/vote');
});

app.get('/face-detection-failed', async (req, res) => {
  req.session.faceDetected = false;
  await clearUserLoginStatus(req.session.user.voter_id);
  req.session.destroy((e) => {
      if (e) {
          console.error("Error destroying session:", e);
      }
  });
  res.redirect('/');
});

async function checkFaceDetectionDuringVote2(req, res, next) {
  if (!req.session || req.session.faceDetected === undefined) {
    return res.status(401).json({ message: 'Face detection status not found in session.' });
  }
  req.faceDetected = req.session.faceDetected;
  next();
}

// Route to serve the face monitor page
app.get('/face-monitor', (req, res) => {
  res.sendFile(path.join(frontendPath, 'Face-Detection-JavaScript' ,'index.html'));
});

// Route to handle face detection status updates
app.post('/face-detection-status', (req, res) => {
  req.session.faceDetectionStatus = { detected: req.body.faceDetected };
  if(req.body.faceDetected == true){
    res.redirect('/vote');
  }
  else{
    res.redirect('/vote');
  }
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
      // console.log('Received form data:', req.body);
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
            // console.log("Hashed Password:", hash);
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
                      req.session.user = {...result2.rows[0]}; 
                      res.json({ 
                          message: "Successfully Logged In",
                          redirectUrl: '/Voter_Info/VoterInfo.html',
                          // redirectUrl: '../Voter_Info/voterInfo.html',
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
    // console.log(result);
    if (result.rows.length > 0) {
      // const result2 = await db.query('SELECT aadhaar FROM voters_details WHERE voter_id = $1', [epicno]);
      const result_check = await db.query('SELECT mobile FROM voters WHERE aadhaar = $1', [result.rows[0].aadhaar]);
      console.log(result_check);
      if(result_check.rows.length == 0) {
        return res.json({ success: false, message: 'No phone number detected or matched' });
      }
      else if(result_check.rows[0].mobile != phone) {
        return res.json({ success: false, message: 'phone number doesn\'t match' });
      }
      else {
        await updateUserLoginStatus(epicno, 'Voter');
        req.session.user = {
          ...result.rows[0],
          phone: phone,
          loginType: 'voter',
        }; 
        res.json({ success: true });
      }
      // console.log(req.session.user);
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
    resp.on('end', async () => {
      const jsonData = JSON.parse(data);
      const user_phone_number = jsonData.user_phone_number;
      // console.log(user_phone_number);
      // console.log(req.session.user);
      // await updateUserLoginStatus(req.session.user.voter_id, 'Voter');
      if (req.session.user && req.session.user.phone === user_phone_number) {
        res.json({ success: true, user: {...req.session.user}, redirectUrl: '../Voter_Info/voterinfo.html' });
      } else {
        try {
          const logoutResponse = await axios.post('http://localhost:3000/logout');
          if (logoutResponse.data.success) {
            res.json({ success: false, message: 'Logged out due to verification failure.', redirectUrl: '/voter_login' });
          } else {
            res.json({ success: false, message: 'Verification failed and logout unsuccessful.', redirectUrl: '/voter_login' });
          }
        } catch (error) {
          res.status(500).json({ success: false, message: 'An error occurred during logout. Please try again.' });
        }
      }
    });
  }).on('error', (err) => {
    console.log('Error: ' + err.message);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  });
});

app.get("/Voter_Info/voterInfo.html", (req, res) => {
  // console.log(req.session);
  res.sendFile(path.join(frontendPath, 'Voter_Info', 'VoterInfo.html'));
});

app.post("/Voter_Info/VoterInfo.html", async (req, res) => {
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
      const voter_id = req.session.user.voter_id;
      const result = await db.query("SELECT voted FROM voters_details WHERE voter_id = $1", [voter_id]);
      const hasVoted = result.rows[0].voted;
      // console.log(hasVoted);
      if (hasVoted==1) {
        return res.send({ message: "User has already voted, Cannot vote more than Once", hasVoted: hasVoted, redirectUrl: '/' });
      }
      else{
        return res.json({ message: "Vote now", hasVoted: hasVoted, user: req.session.user, redirectUrl: '/vote'});
      }
    } else {
      return res.status(400).json({ message: "Failed reCAPTCHA verification" });
    }

  } catch (err) {
    
    return res.json({ message: "user's voterID not found or Something went wrong" });
  }
});

app.get("/vote", checkAccessCount, checkFaceDetection2, (req, res) => {
  // console.log(req.session);
  res.sendFile(path.join(frontendPath, 'Vote', 'vote.html'));
});

app.post("/vote", async (req, res)=>{
  try{
    // console.log('Received form data:', req.body);
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // const result = await db2.query("SELECT * FROM parties WHERE party_name = $1",[req.body.party]);
    // console.log(result.rows[0]);
    const hasVoted = req.session.user.voted;
    const voterId = req.session.user.voter_id;
    // console.log(hasVoted);
    await db.query("UPDATE voters_details SET voted = voted + 1 WHERE voter_id = $1", [voterId]);
    // if (req.faceDetected) {
      // console.log(req.body.party);
      await db.query("UPDATE parties SET count = count + 1 WHERE party_name = $1", [req.body.party]); // if using vercel database
      // await db2.query("UPDATE parties SET count = count + 1 WHERE party_name = $1", [req.body.party]); // if using local database
      res.json({ message: 'Your vote has been submitted successfully!' });
    // } else {
    //   res.json({ message: 'Your vote has been submitted but no face was detected.' });
    // }
  }catch(err){
    console.log(err.message);
  }
});

app.post('/logout', async (req, res) => {
  // const accesscount = req.session.accesscount;
  if (req.session.user) {
    // console.log(req.session.user);
    await clearUserLoginStatus(req.session.user.voter_id);
  }
  req.session.destroy((err) => {
      if (err) {
          return res.json({ success: false, message: 'Logout failed' });
      }

      // Respond with success
      res.json({ success: true, message: 'Logged out' });
  });
});

app.listen(port || 8000, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
