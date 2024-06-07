import express from "express";
import bodyParser from "body-parser";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";
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

const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, 'HomePage.html'));
});

app.post("/Digilocker_login/digilogin.html", async (req, res) => {
    try{
        console.log('Received form data:', req.body);
        if(req.body.type === "Mobile"){
            const mobile = req.body.mobile;
            const pin = req.body.pin;
            const result = await await db.query("SELECT * FROM voters WHERE mobile = $1", [mobile]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        app.get("/", (req, res) => {
                            res.sendFile(path.join(frontendPath, 'Virtual_election\VoterLogin.html'));
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

        else if(req.body.type === "Username"){
            const username = req.body.username;
            const pin = req.body.pin;
            const result = await await db.query("SELECT * FROM voters WHERE username = $1", [username]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        app.get("/", (req, res) => {
                            res.sendFile(path.join(frontendPath, 'Virtual_election\VoterLogin.html'));
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
            const result = await await db.query("SELECT * FROM voters WHERE aadhaar = $1", [aadhaar]);
            if(result.rows.length > 0){
                const user = result.rows[0];
                const storedHashedPassword = user.pin;
                bcrypt.compare(loginPassword, storedHashedPassword, (err, result) => {
                    if (err) {
                      console.error("Error comparing passwords:", err);
                    } else {
                      if (result) {
                        app.get("/", (req, res) => {
                            res.sendFile(path.join(frontendPath, 'Virtual_election\VoterLogin.html'));
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
