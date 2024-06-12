function selectCandidate(button) {
    const rows = document.querySelectorAll('.candidates-table tbody tr');
    rows.forEach(row => {
        row.querySelector('.radio').style.backgroundColor = 'white';
        row.querySelector('.radio').removeAttribute('data-selected');
    });
    const row = button.parentNode.parentNode;
    const radio = row.querySelector('.radio');
    radio.style.backgroundColor = 'red';
    radio.setAttribute('data-selected', 'true');
}

// const userDetails = JSON.parse(sessionStorage.getItem('userDetails'));
// alert(userDetails);
// if (!userDetails) {
//     alert("You are not logged in.");
//     window.location.href = "/";
// }

function submitVote(event) {
    event.preventDefault();
    const selectedCandidateElement = document.querySelector('.radio[data-selected="true"]');
    if (!selectedCandidateElement) {
        alert('Please select a candidate before proceeding.');
        return;
    }
    
    const selectedCandidate = selectedCandidateElement.getAttribute('data-candidate');
    const selectedparty = selectedCandidateElement.getAttribute('data-party');
    console.log(selectedparty);
    const jsonData = {};
    jsonData['candidate']=selectedCandidate;
    jsonData['party']=selectedparty;
    const confirmation = confirm(`Are you sure you want to vote for ${selectedCandidate}?`);

    if (confirmation) {
        document.getElementById('proceedButton').disabled = true;
        alert('Your vote has been submitted successfully!');
        // Add your vote submission logic here, e.g., send it to a server
        fetch('/Digilocker_login/Vote/vote.html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(err => {
            console.log(err);
            alert("An error occurred. Please try again.");
        });
    }
}
