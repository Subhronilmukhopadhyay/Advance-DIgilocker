from base64 import b64decode

import numpy as np
import cv2
from matplotlib import pyplot as plt

haar_face_detector = cv2.CascadeClassifier('.\Required Models (2_7)\haarcascade_frontalface_default.xml')
haar_eye_detector = cv2.CascadeClassifier('.\Required Models (2_7)\haarcascade_eye.xml')

def imshow(image, title="Image", size=8):
    """Convert image to RGB format and plot it in a given size
    maintaining the aspect ratio.

    Args:
        title (str, optional): Plot title. Defaults to "Image".
        image (numpy.ndarray): Image to plot.
        size (int, optional): Image height to use in plot, in inches.
    """
    h, w = image.shape[0], image.shape[1]
    aspect_ratio = w / h
    plt.figure(figsize=(size * aspect_ratio, size))
    plt.title(title)
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.show()

def face_detector(image):
    """Detect faces and eyes in images using haar cascade classifiers
    and draw rectangles over them.

    Args:
        image (numpy.ndarray): Image to perform detection and draw over.

    Returns:
        numpy.ndarray: Input image with rectangles drawn over facial
            features.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = haar_face_detector.detectMultiScale(gray, scaleFactor=1.3,
                                                minNeighbors=5)
    if faces is ():
        return image

    for (x, y, w, h) in faces:
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 0, 255), 2)
        roi_color = image[y:y + h, x:x + w]
        roi_gray = gray[y:y + h, x:x + w]
        eyes = haar_eye_detector.detectMultiScale(roi_gray, scaleFactor=1.02,
                                                  minNeighbors=3)

        if eyes is ():
            return image
        else:
            for (eye_x, eye_y, eye_w, eye_h) in eyes:
                cv2.rectangle(roi_color, (eye_x, eye_y),
                            (eye_x + eye_w, eye_y + eye_h), (0, 255, 0), 2)

    return image
 
def json_to_image(js_object):
    """Converts JSON object to OpenCV BGR image.

    Args:
        js_object(str): JSON object to convert to OpenCV BGR image.

    Returns:
        numpy.ndarray: OpenCV BGR image.
    """
    image_bytes = b64decode(js_object.split(',')[1])
    # Bytes to Numpy array.
    img_array = np.frombuffer(image_bytes, dtype=np.uint8)
    # Numpy array to OpenCV BGR.
    frame = cv2.imdecode(img_array, flags=1)

    return frame

# def video_stream():
    """Use Javascript code to open a video stream using the local
    computer's webcam. Transmit the captured frames to Colab until a
    button is pressed to end the stream.
    """
js = Javascript('''
    let video;
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
''')

    # Displays Javascript-based interface in notebook.
    # display(js)

# Start webcam stream.
# video_stream()

# While the stream is not closed, perform detection.

js2py.translate_file(r'Digilocker_project\Backend\PROJECT_VOTING SYSTEM\PROJECT_VOTING SYSTEM\video_stream.js', 'test.py')
from test import *

while True:
    clear_output(wait=True)
    test.stream_frame()
    if not frame_js:
        break
    img = json_to_image(frame_js)
    imshow(face_detector(img))

# The models work fine and they rarely give false positives. Nonetheless, if the face is turned or too far away from the camera, they fail to detect facial features. It is also important to consider that facial feature detection models usually have a hard time detecting features on bearded faces, given a lack of training samples having that feature.
# 
# Lower resolutions may increase speed performance but will also make it harder for the model to work. Making the haar models have less resource-demanding parameters (scale factor set higher and mininum neighborhood set lower) does not help much, so we tuned them for better accuracy.
