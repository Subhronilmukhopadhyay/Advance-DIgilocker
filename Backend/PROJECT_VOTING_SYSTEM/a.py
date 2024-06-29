import cv2
import sys
import time

class FaceDetector:
    def __init__(self, faceCascadePath):
        self.faceCascade = cv2.CascadeClassifier(faceCascadePath)

    def detect(self, image, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30)):
        rects = self.faceCascade.detectMultiScale(image,
                                                  scaleFactor=scaleFactor,
                                                  minNeighbors=minNeighbors,
                                                  minSize=minSize,
                                                  flags=cv2.CASCADE_SCALE_IMAGE)
        return rects

def resize(image, width=None, height=None, inter=cv2.INTER_AREA):
    (h, w) = image.shape[:2]
    dim = None

    if width is None and height is None:
        return image

    if width is None:
        r = height / float(h)
        dim = (int(r * w), height)
    else:
        r = width / float(w)
        dim = (width, int(r * h))

    resized = cv2.resize(image, dim, interpolation=inter)
    return resized

fd = FaceDetector(r'C:\College learnings\Development\Digilocker_project\Backend\PROJECT_VOTING_SYSTEM\Required_Models_(2_7)\haarcascade_frontalface_default.xml')
webcam = cv2.VideoCapture(0)

start_time = time.time()

while True:
    (grabbed, frame) = webcam.read()
    frame = resize(frame, width=500)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faceRects = fd.detect(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    frameClone = frame.copy()

    for (x, y, w, h) in faceRects:
        cv2.rectangle(frameClone, (x, y), (x+w, y+h), (0, 255, 0), 2)

    cv2.imshow("Faces", frameClone)

    if len(faceRects) > 0:
        print("Face detected")
        webcam.release()
        cv2.destroyAllWindows()
        sys.exit(0)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

    if time.time() - start_time > 10:
        print("No face detected")
        webcam.release()
        cv2.destroyAllWindows()
        sys.exit(0)
