document.addEventListener('DOMContentLoaded', function () {
    // Existing functionality to handle CAPTCHA
    const form = document.querySelector('#captchaForm');

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const captchaResponse = grecaptcha.getResponse();
        
        if (!captchaResponse.length > 0) {
            alert("Please complete the CAPTCHA.");
            return;
        }

        const formData = new FormData(e.target);
        const params = new URLSearchParams(formData);

        fetch('/Digilocker_login/Voter_Info/VoterInfo.html', {
            method: 'POST',
            body: params,
        })
        .then(res => res.json())
        .then(data => {
            if(data.hasVoted){
                alert(data.message);
                window.location.href = "/";
            }
            else if (data.captchaSuccess) {
                console.log("Validation Success");
                window.location.href = "../Vote/vote.html";
            } else {
                console.log("CAPTCHA validation failed.");
                alert("CAPTCHA validation failed. Please try again.");
                grecaptcha.reset();
            }
        })
        .catch(err => {
            console.log(err);
            alert("An error occurred. Please try again.");
        });
    });

    // New functionality to fetch and display user details

    const userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
    if (!userDetails) {
        alert("You are not logged in.");
        window.location.href = "/";
    } else {
        document.getElementById('voter-id').textContent = userDetails.voter_id;
        document.getElementById('constituency').textContent = userDetails.constituency;
        document.getElementById('aadhaar').textContent = userDetails.aadhaar;
        document.getElementById('dob').textContent = userDetails.dob;
        document.getElementById('full-name').textContent = userDetails.name_of_voter;
        document.getElementById('father-name').textContent = userDetails.name_of_father_of_voter;
        document.getElementById('gender').textContent = userDetails.gender;
        document.getElementById('address').textContent = userDetails.address;
    }    
});
