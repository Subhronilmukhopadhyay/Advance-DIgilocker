async function handleSubmit(event) {
    event.preventDefault();
    const epicno = document.getElementById('epicno').value;
    const phone = document.getElementById('phone').value;

    const response = await fetch('/virtual_election/voter_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ epicno, phone })
    });

    const data = await response.json();

    if (data.success) {
        document.querySelector('form.info').style.display = 'none';
        document.getElementById('otpSection').style.display = 'block';
    } else {
        alert(data.message);
    }
}

function phoneEmailListener(userObj) {
    var user_json_url = userObj.user_json_url;
    fetch('/virtual_election/verify_otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_json_url })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // console.log("success");
            window.location.href = data.redirectUrl;
        } else {
            alert('OTP verification failed.');
        }
    })
    .catch(err => {
        console.error(err);
        alert('An error occurred. Please try again.');
    });
}