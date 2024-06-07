function submitVote() {
    // Get the selected candidate
    const selectedCandidate = document.querySelector('input[name="vote"]:checked');
    
    if (!selectedCandidate) {
        alert('Please select a candidate before proceeding.');
        return;
    }
    
    // Confirmation message
    const confirmation = confirm(`Are you sure you want to vote for ${selectedCandidate.value}?`);

    if (confirmation) {
        // Disable the button to prevent multiple submissions
        document.getElementById('proceedButton').disabled = true;

        // Submit the vote (this is where you would add your vote submission logic)
        alert('Your vote has been submitted successfully!');
        // Add your vote submission logic here, e.g., send it to a server
    }
}