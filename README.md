# Advanced Digital Voting System

A secure web-based platform for digital voting that supports both resident Indian voters and NRI (Non-Resident Indian) voters with multi-factor authentication and advanced security features.

## Overview

The Advanced Digital Voting System provides a comprehensive digital solution for conducting secure elections. The system implements multiple layers of security including session management, facial recognition, and access controls to ensure the integrity of the voting process.

## Features

### User Authentication
- Dual authentication paths for different voter types:
  - NRI voter authentication
  - Indian resident voter authentication
- Multiple login options:
  - DigiLocker integration (mobile/username/Aadhaar)
  - Voter ID and phone number verification

### Security Measures
- Session management (only one active session per user)
- Session timeout (5-minute maximum session duration)
- Facial recognition verification using Python
- CAPTCHA verification to prevent bot access
- Limited voting attempts (maximum 3 access attempts)
- Scheduled voting (specific date and time restrictions)

### Voting Process
1. Welcome page
2. Voting guidelines (separate for NRI and Indian voters)
3. Nationality selection
4. Authentication (DigiLocker or Voter ID)
5. Voter information verification
6. Facial scan verification
7. Vote casting interface

## User Journey

### NRI Voter Path
1. Welcome page → Guidelines → Nationality selection → NRI login
2. Accept guidelines and complete registration form
3. Verification → Voter information → Facial scan → Vote casting

### Indian Resident Voter Path
1. Welcome page → Guidelines → Nationality selection → Homepage
2. Choose authentication method:
   - **DigiLocker**: Login with mobile/username/Aadhaar or create a new DigiLocker ID
   - **Voter ID**: Enter Voter ID and phone number → OTP verification
3. Verification → Voter information → Facial scan → Vote casting

## System Architecture

The system is structured with progressive verification, ensuring that each voter:
- Is properly authenticated
- Is the person they claim to be (facial recognition)
- Has not already voted
- Is voting within the designated timeframe
- Is human (CAPTCHA verification)

## Technical Implementation

### Security Features
- **Session Control**: Only one active session per user allowed
- **Timeout Mechanism**: 5-minute maximum session duration
- **Facial Recognition**: Python-based face recognition model for identity verification
- **Access Limits**: Maximum 3 voting attempts per user
- **Scheduled Access**: Voting restricted to specific dates and times

### Voting Interface
- Tabular format displaying:
  - Candidate name
  - Party name
  - Party symbol
  - Candidate photo
  - Selection mechanism (radio buttons)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Subhronilmukhopadhyay/Advance-DIgilocker.git
   cd Advance-DIgilocker
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies:
   ```bash
   pip install opencv-python==4.10.0.84
   ```

4. Set up PostgreSQL database:
   - Create a new PostgreSQL database
   - Create the following tables:
     - `login_status`: user_id, login_type, accesscount, start_date, start_time, end_time
     - `parties`: id, candidate, party_name, count
     - `voters`: id, full_name, dob, gender, mobile, adhaar, pin
     - `voter_details`: voter_id, constituency, adhaar, dob, name_of_voter, name_of_voter_father, gender, address, voted

5. Configure environment variables:
   - Create a `.env` file in the root directory with the following variables:
     ```
     DB_USER=your_postgresql_username
     DB_PASSWORD=your_postgresql_password
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=your_database_name
     SESSION_SECRET=your_session_secret
     TWILIO_ACCOUNT_SID=your_twilio_sid
     TWILIO_AUTH_TOKEN=your_twilio_token
     TWILIO_PHONE_NUMBER=your_twilio_phone
     MAIL_USER=your_email_address
     MAIL_PASS=your_email_password
     ```

6. Start the application:
   ```bash
   npm start
   ```

## Usage

### Voter Portal

1. Access the voting platform through the main URL
2. Navigate through the following pages:
   - Welcome page
   - Guidelines (NRI or Indian voter sections)
   - Nationality selection
   - Authentication:
     - For NRI voters: NRI login portal
     - For Indian voters: DigiLocker or Voter ID authentication
   - Voter information verification
   - Facial scan verification
   - Vote casting

### Administrative Functions

1. Access the admin portal (if applicable)
2. Manage candidate and party information in the database
3. View voting statistics
4. Monitor active sessions

### Security Notes

- Each user is limited to one active session
- Sessions automatically expire after 5 minutes
- Voters are limited to 3 access attempts
- Voting is restricted to specific dates and times
- Facial recognition verification is required before vote casting

## Dependencies

### Node.js Dependencies
- axios@1.7.2 - Promise-based HTTP client
- bcrypt@5.1.1 - Password hashing
- bcryptjs@2.4.3 - JavaScript implementation of bcrypt
- body-parser@1.20.2 - Request parsing middleware
- child_process@1.0.2 - Node.js child process module
- cors@2.8.5 - Cross-origin resource sharing
- crypto@1.0.1 - Cryptographic functionality
- dotenv@16.4.5 - Environment variable loading
- express-session@1.18.0 - Session middleware
- express@4.19.2 - Web application framework
- face-api.js@0.20.0 - JavaScript face recognition API
- https@1.0.0 - HTTPS server functionality
- nodemailer@6.9.13 - Email sending capabilities
- passport-local@1.0.0 - Local authentication strategy
- passport@0.7.0 - Authentication middleware
- pg@8.12.0 - PostgreSQL client
- sillyname@0.1.0 - Random name generator
- twilio@5.1.1 - SMS and communication API

### Python Dependencies
- opencv-python==4.10.0.84 - Computer vision library for facial recognition

### Database
- PostgreSQL - Relational database for storing voter and election data
