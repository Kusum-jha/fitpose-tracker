const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const poseStatus = document.getElementById('pose-status');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start-camera');
const stopBtn = document.getElementById('stop-camera');
const privacyNotice = document.getElementById('privacy-notice');

// Load MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.poseLandmarks) {
    poseStatus.textContent = 'Pose: ✅ Detected';
    feedback.textContent = "✅ Feedback: Ready to detect exercise!";

    results.poseLandmarks.forEach(landmark => {
      const x = landmark.x * canvasElement.width;
      const y = landmark.y * canvasElement.height;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
      canvasCtx.fillStyle = "lime";
      canvasCtx.fill();
    });
  } else {
    poseStatus.textContent = 'Pose: ❌ Not Detected';
    feedback.textContent = "⚠️ Feedback: Please stand in front of camera.";
  }

  canvasCtx.restore();
});

let camera;

startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();
    privacyNotice.textContent = "🔒 Your webcam feed is processed locally in your browser and never uploaded.";
  } catch (err) {
    alert("Camera access denied. Please allow webcam permission.");
  }
});

stopBtn.addEventListener('click', () => {
  if (camera) {
    const stream = videoElement.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    camera = null;
    feedback.textContent = "Camera stopped.";
    poseStatus.textContent = "Pose: ❌ Not Available";
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
});
const placeholderImg = document.getElementById('placeholder');
const toggleThemeCheckbox = document.getElementById('toggle-theme');

// Theme Toggle Switch
toggleThemeCheckbox.addEventListener('change', () => {
  document.body.classList.toggle('light-mode');
});

// Show camera, hide placeholder
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;

    placeholderImg.style.display = "none";
    videoElement.removeAttribute("hidden");

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();
    privacyNotice.textContent = "🔒 Your webcam feed is processed locally in your browser.";
  } catch (err) {
    alert("Camera access denied. Please allow webcam permission.");
  }
});

stopBtn.addEventListener('click', () => {
  if (camera) {
    const stream = videoElement.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    camera = null;
    feedback.textContent = "Camera stopped.";
    poseStatus.textContent = "Pose: ❌ Not Available";
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    placeholderImg.style.display = "block";
    videoElement.setAttribute("hidden", "true");
  }
});
