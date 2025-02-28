import sys
import cv2
import os

# Get the image file path from command-line arguments
if len(sys.argv) < 2:
    print("No image file provided", flush=True)
    sys.exit(1)

image_path = sys.argv[1]

# Build the path to the cascade file relative to a.py's location
current_directory = os.path.dirname(os.path.abspath(__file__))
xml_file_path = os.path.join(current_directory, 'Required_Models_(2_7)', 'haarcascade_frontalface_default.xml')

# Check if the XML file exists
if not os.path.exists(xml_file_path):
    print("Cascade XML file not found", flush=True)
    sys.exit(1)

# Load the cascade classifier
face_cascade = cv2.CascadeClassifier(xml_file_path)

# Read the image file
img = cv2.imread(image_path)
if img is None:
    print("Could not read image", flush=True)
    sys.exit(1)

# Perform face detection
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
faces = face_cascade.detectMultiScale(gray, 1.1, 4)

if len(faces) > 0:
    print("Face detected", flush=True)
else:
    print("No face detected", flush=True)
