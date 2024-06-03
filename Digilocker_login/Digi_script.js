function showForm(formId) {
    // Hide all forms
    document.getElementById('mobile').style.display = 'none';
    document.getElementById('username').style.display = 'none';
    document.getElementById('aadhaar').style.display = 'none';

    // Remove active class from all tabs
    document.getElementById('tab-mobile').classList.remove('active');
    document.getElementById('tab-username').classList.remove('active');
    document.getElementById('tab-aadhaar').classList.remove('active');

    // Show the selected form
    document.getElementById(formId).style.display = 'block';

    // Add active class to the selected tab
    document.getElementById('tab-' + formId).classList.add('active');
}

// Initially show the mobile form
document.getElementById('mobile').style.display = 'block';
