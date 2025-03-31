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
