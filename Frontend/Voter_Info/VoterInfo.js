document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

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
            if (data.captchaSuccess) {
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
});
