let userDetailsString = {}

document.addEventListener('DOMContentLoaded', (event) => {
    userDetailsString = sessionStorage.getItem('userDetails');
    // console.log(userDetailsString);
    if (!userDetailsString) {
        alert("You are not logged in.");
        window.location.href = "/";
        return; 
    }

    startVideoProcessing();

    // if (sessionStorage.getItem('logoutInProgress') === 'true') {
    //     sessionStorage.removeItem('logoutInProgress');
    //     window.location.href = "/";
    //     return;
    // }

    setTimeout(() => {
        alert("You have been on this page for 5 minutes. Redirecting to homepage.");
        logout();
        window.location.href = "/";
    }, 300000);
});

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

        // userDetailsString = JSON.parse(sessionStorage.getItem('userDetails'));
        const loginType = userDetailsString.loginType;
        console.log(userDetailsString);
        let endpoint = '';
        if (loginType == 'Digilocker') {
            endpoint = '/Digilocker_login/Voter_Info/VoterInfo.html';
        }
        if (loginType === 'voter') {
            endpoint = '/virtual_election/Voter_Info/VoterInfo.html';
        }

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            logout();
            window.location.href = "/";
        })
        .catch(err => {
            console.log(err);
            alert("An error occurred. Please try again.");
            document.getElementById('proceedButton').disabled = false;
        });
    }
    
};

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); 
        fetch('/logout', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Leaving!");
                    window.location.href = this.href; 
                } else {
                    alert('Failed to log out');
                }
            })
            .catch(error => console.error('Error:', error));
    });
  });
  
function logout() {
    fetch('/logout', {
    method: 'POST',
    }).then(response => {
    if (response.ok) {
        console.log('Logged out successfully');
    } else {
        console.error('Logout failed');
    }
    }).catch(error => {
    console.error('Error logging out:', error);
    });
}

window.addEventListener('beforeunload', function(e) {
    navigator.sendBeacon('/logout', JSON.stringify({ user: JSON.parse(sessionStorage.getItem('userDetails')) }));
});

function startVideoProcessing() {
    // Implement your logic to start video processing here
    // Example: establish WebSocket connection, initialize video capture, etc.
    // Ensure to handle video processing and sending data back to server if needed
    // let video;
    let div = null;
    let stream;
    let captureCanvas;
    let imgElement;

    let pendingResolve = null;
    let shutdown = false;

    // Free resources once video stream stops.
    function removeDom() {
        stream.getVideoTracks()[0].stop();
        video.remove();
        div.remove();
        video = null;
        div = null;
        stream = null;
        imgElement = null;
        captureCanvas = null;
    }

    // Draw every frame on Colab until the stream stops.
    function onAnimationFrame() {
        if (!shutdown) {
            window.requestAnimationFrame(onAnimationFrame);
        }
        if (pendingResolve) {
            let result = "";
            if (!shutdown) {
                captureCanvas.getContext('2d').drawImage(video, 0, 0, 640, 480);
                result = captureCanvas.toDataURL('image/jpeg', 0.8)
            }
            let lp = pendingResolve;
            pendingResolve = null;
            lp(result);
        }
    }

    // Create div to hold video stream and button.
    async function createDom() {
        if (div !== null) {
            return stream;
        }
        div = document.createElement('div');
        div.style.border = '2px solid black';
        div.style.padding = '3px';
        div.style.width = '100%';
        div.style.maxWidth = '600px';
        document.body.appendChild(div);

        video = document.createElement('video');
        video.style.display = 'block';
        video.width = div.clientWidth - 6;
        video.setAttribute('playsinline', '');
        video.onclick = () => { shutdown = true; };
        stream = await navigator.mediaDevices.getUserMedia(
            {video: { facingMode: "environment"}});
        div.appendChild(video);

        imgElement = document.createElement('img');
        imgElement.style.position = 'absolute';
        imgElement.style.zIndex = 1;
        imgElement.onclick = () => { shutdown = true; };
        div.appendChild(imgElement);

        const instruction = document.createElement('div');
        instruction.innerHTML =
            '<span style="blue: red; font-weight: bold;">' +
            'click here to stop the video</span>';
        div.appendChild(instruction);
        instruction.onclick = () => { shutdown = true; };

        video.srcObject = stream;
        await video.play();
        captureCanvas = document.createElement('canvas');
        captureCanvas.width = 640;
        captureCanvas.height = 480;
        window.requestAnimationFrame(onAnimationFrame);

        return stream;
    }

    // Function to manage the whole Javascript code.
    async function stream_frame() {
        if (shutdown) {
            removeDom();
            shutdown = false;
            return '';
        }

        stream = await createDom();

        let result = await new Promise(function(resolve, reject) {
            pendingResolve = resolve;
        });
        shutdown = false;

        return result
    }
}

