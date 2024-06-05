document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Form submitted successfully!');
});

$(document).ready(function(){
    function addOptions(select, start, end) {
        for (var i = start; i <= end; i++) {
            var option = $("<option>").val(i).text(i);
            select.append(option);
        }
    }

    var daysSelect = $("#dob-day");
    addOptions(daysSelect, 1, 31);

    var monthsSelect = $("#dob-month");
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (var i = 0; i < months.length; i++) {
        var option = $("<option>").val(i + 1).text(months[i]);
        monthsSelect.append(option);
    }

    var yearsSelect = $("#dob-year");
    var currentYear = new Date().getFullYear();
    addOptions(yearsSelect, currentYear - 100, currentYear);
});

document.addEventListener("DOMContentLoaded", function() {
    var mobileInput = document.getElementById("mobile");
    
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