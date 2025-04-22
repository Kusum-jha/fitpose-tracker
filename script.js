const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const poseStatus = document.getElementById('pose-status');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start-camera');
const stopBtn = document.getElementById('stop-camera');
const privacyNotice = document.getElementById('privacy-notice');
const uploadInput = document.getElementById('upload');
const placeholderImg = document.getElementById('placeholder');
const toggleThemeCheckbox = document.getElementById('toggle-theme');
const startSquatBtn = document.getElementById('start-squat');
const startPushUpBtn = document.getElementById('start-push-up');

let camera;
let exerciseMode = '';  // Track the current exercise mode
let uploadedImage = null;  // Store the uploaded image

// Pose Detection setup
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
  
  // If there's an uploaded image, display it
  if (uploadedImage) {
    canvasCtx.drawImage(uploadedImage, 0, 0, canvasElement.width, canvasElement.height);
  } else {
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  if (results.poseLandmarks) {
    const poseLandmarks = results.poseLandmarks;

    // Handling feedback based on exercise mode
    let feedbackText = "";
    if (exerciseMode === 'push-up') {
      // Push-Up Detection Logic
      const elbowAngle = Math.abs(poseLandmarks[13].y - poseLandmarks[14].y);
      const shoulderAngle = Math.abs(poseLandmarks[11].y - poseLandmarks[12].y);

      if (elbowAngle > 0.3) {
        feedbackText = "❗ Push-Up Downward: Keep your arms bending!";
      } else if (elbowAngle < 0.1 && shoulderAngle < 0.05) {
        feedbackText = "✅ Push-Up Up: Arms fully extended!";
      } else {
        feedbackText = "⚠️ Adjust your posture!";
      }
    } else if (exerciseMode === 'squat') {
      // Squat Detection Logic
      const hipKneeAngle = Math.abs(poseLandmarks[23].y - poseLandmarks[25].y); 
      const kneeAngle = Math.abs(poseLandmarks[25].y - poseLandmarks[26].y);

      if (hipKneeAngle < 0.3 && kneeAngle > 0.2) {
        feedbackText = "✅ Squat Down: Keep your knees aligned.";
      } else if (hipKneeAngle > 0.4 && kneeAngle < 0.1) {
        feedbackText = "✅ Squat Up: Stand tall!";
      } else {
        feedbackText = "⚠️ Squat form not detected properly!";
      }
    }

    feedback.textContent = feedbackText;

    // Display the pose landmarks (green dots)
    canvasCtx.fillStyle = "lime";
    results.poseLandmarks.forEach((landmark) => {
      const x = landmark.x * canvasElement.width;
      const y = landmark.y * canvasElement.height;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
      canvasCtx.fill();
    });

    poseStatus.textContent = "Pose: ✅ Detected";
  } else {
    poseStatus.textContent = 'Pose: ❌ Not Detected';
    feedback.textContent = "⚠️ Please stand in front of the camera.";
  }

  canvasCtx.restore();
});

// Start Camera
startBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    await videoElement.play();

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await pose.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    await camera.start();

    placeholderImg.classList.remove('show');
    videoElement.classList.add('show');
    canvasElement.classList.add('show');

    privacyNotice.textContent = "🔒 Your webcam feed is processed locally in your browser and never uploaded.";
  } catch (err) {
    alert("Camera access denied. Please allow webcam permission.");
  }
});

// Stop Camera
stopBtn.addEventListener('click', () => {
  if (camera) {
    camera.stop();

    const stream = videoElement.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    videoElement.srcObject = null;
    camera = null;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    poseStatus.textContent = "Pose: ❌ Not Available";
    feedback.textContent = "Camera stopped.";

    placeholderImg.classList.add('show');
    videoElement.classList.remove('show');
    canvasElement.classList.remove('show');
  }
});

// Toggle Theme
toggleThemeCheckbox.addEventListener('change', () => {
  document.body.classList.toggle('light-mode');
});

// Set exercise mode to Squat
startSquatBtn.addEventListener('click', () => {
  exerciseMode = 'squat';
  feedback.textContent = "🎯 Focus on your squat form.";
  poseStatus.textContent = "Pose: 🏋️ Squat Mode";
});

// Set exercise mode to Push-Up
startPushUpBtn.addEventListener('click', () => {
  exerciseMode = 'push-up';
  feedback.textContent = "🎯 Focus on your push-up form.";
  poseStatus.textContent = "Pose: 💪 Push-Up Mode";
});

// Upload Image
uploadInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    uploadedImage = img;
    const uploadCanvas = document.getElementById('canvas');
    const ctx = uploadCanvas.getContext('2d');
    const placeholderWrapper = document.querySelector('.canvas-wrapper'); // Get the wrapper for proper positioning

    // Set canvas dimensions to match placeholder size (ensure scaling)
    uploadCanvas.width = placeholderWrapper.offsetWidth;
    uploadCanvas.height = placeholderWrapper.offsetHeight;

    // Clear the previous drawing (if any)
    ctx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);

    // Calculate the scaling factors to maintain aspect ratio
    const scaleX = uploadCanvas.width / img.width;
    const scaleY = uploadCanvas.height / img.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate the position to center the image in the placeholder
    const x = (uploadCanvas.width - img.width * scale) / 2;
    const y = (uploadCanvas.height - img.height * scale) / 2;

    // Draw the image on the canvas
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Now the uploaded image will be shown in the placeholder area
    placeholderImg.classList.remove('show');
    videoElement.classList.remove('show');
    canvasElement.classList.remove('show');
    uploadCanvas.classList.add('show');
  };
});
