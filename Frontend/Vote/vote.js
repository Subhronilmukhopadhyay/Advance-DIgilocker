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
function submitVote() {
    
    const selectedCandidateElement = document.querySelector('.radio[data-selected="true"]');
    
    if (!selectedCandidateElement) {
        alert('Please select a candidate before proceeding.');
        return;
    }
    
    const selectedCandidate = selectedCandidateElement.getAttribute('data-candidate');
    
    const confirmation = confirm(`Are you sure you want to vote for ${selectedCandidate}?`);

    if (confirmation) {
        document.getElementById('proceedButton').disabled = true;
        alert('Your vote has been submitted successfully!');
        // Add your vote submission logic here, e.g., send it to a server
    }
}
