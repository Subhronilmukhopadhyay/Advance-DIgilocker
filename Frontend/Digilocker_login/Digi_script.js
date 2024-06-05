function showForm(formId) {
    document.getElementById('mobile').style.display = 'none';
    document.getElementById('username').style.display = 'none';
    document.getElementById('aadhaar').style.display = 'none';

    document.getElementById('tab-mobile').classList.remove('active');
    document.getElementById('tab-username').classList.remove('active');
    document.getElementById('tab-aadhaar').classList.remove('active');

    document.getElementById(formId).style.display = 'block';

    document.getElementById('tab-' + formId).classList.add('active');
}

document.getElementById('mobile').style.display = 'block';

document.addEventListener("DOMContentLoaded", function() {
    var mobileInput = document.getElementById("signin-form").querySelector("input[type='text']");

    mobileInput.addEventListener("input", function() {
        var mobileNumber = this.value.trim();
        mobileNumber = mobileNumber.replace(/\D/g, "");

        if (/^\d{10}$/.test(mobileNumber)) {
            this.setCustomValidity("");
        } else {
            this.setCustomValidity("Mobile number must be 10 digits long");
        }
    });
});