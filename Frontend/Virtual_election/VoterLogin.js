function validateForm() {
    // Get the input values
    var epicNumber = document.getElementById("epicno").value;
    var phoneNumber = document.getElementById("phone").value;
    var otp = document.getElementById("otp").value;
    
    // Regular expressions for validation
    var epicRegex = /^[A-Za-z]{3}[0-9]{7}$/;
    var phoneRegex = /^[0-9]{10}$/;
    var otpRegex = /^[0-9]{6}$/;

    // Validate the EPIC number
    if (!epicRegex.test(epicNumber)) {
        alert("Invalid Voter ID/EPIC Number. It should be 3 alphabets followed by 7 digits.");
        return false;
    }

    // Validate the phone number
    if (!phoneRegex.test(phoneNumber)) {
        alert("Invalid Phone Number. It should be 10 digits.");
        return false;
    }

    // Validate the OTP
    if (!otpRegex.test(otp)) {
        alert("Invalid OTP. It should be 6 digits.");
        return false;
    }

    // If all validations pass
    alert("Validation successful!");
    return true;
}

async function sendOTP() {
    const phoneNumber = document.getElementById("phone").value;

    const response = await fetch('/send-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber })
    });

    const result = await response.json();
    alert(result.message);
}

async function verifyOTP() {
    const phoneNumber = document.getElementById("phone").value;
    const otp = document.getElementById("otp").value;

    const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber, otp: otp })
    });

    const result = await response.json();
    alert(result.message);
}