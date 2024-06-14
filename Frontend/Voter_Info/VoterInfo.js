document.addEventListener('DOMContentLoaded', () => {
  
    document.getElementById('captchaForm').addEventListener('submit', (e) => {
      e.preventDefault();
  
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
  
      fetch('/Digilocker_login/Voter_Info/VoterInfo.html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then(result => {
        if (result.hasVoted == 1) {
          alert(result.message);
          window.location.href = "/";
        } else if (result.hasVoted == 0) {
          sessionStorage.setItem('userDetails', JSON.stringify(data.user));
          // window.location.href = "../Vote/vote.html";
          window.location.href = "/Digilocker_login/Vote/vote.html";
        } else {
          alert("Failed reCAPTCHA verification or another issue occurred");
        }
      })
      .catch(err => {
        console.error("Error:", err);
        alert("Something went wrong, please try again later.");
      });
    });
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
  