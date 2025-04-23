document.addEventListener("DOMContentLoaded", function () {
  const videoElement = document.getElementById('webcam');
  const canvasElement = document.getElementById('output');
  const canvasCtx = canvasElement.getContext('2d');
  const poseStatus = document.getElementById('pose-status');
  const feedback = document.getElementById('feedback');
  const startBtn = document.getElementById('start-camera');
  const stopBtn = document.getElementById('stop-camera');
  const privacyNotice = document.getElementById('privacy-notice');
  const placeholderImg = document.getElementById('placeholder');
  const toggleThemeCheckbox = document.getElementById('themeToggle');
  const startSquatBtn = document.getElementById('start-squat');
  const startPushUpBtn = document.getElementById('start-push-up');

  const threeContainer = document.getElementById("threejs-container");
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(canvasElement.width, canvasElement.height);
  threeContainer.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera3D = new THREE.PerspectiveCamera(75, canvasElement.width / canvasElement.height, 0.1, 1000);
  camera3D.position.z = 500;

  const annotations = [];
  function addAnnotation(x, y) {
    const geometry = new THREE.SphereGeometry(10, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x - canvasElement.width / 2, -(y - canvasElement.height / 2), 0);
    scene.add(sphere);
    annotations.push(sphere);
  }

  function clearAnnotations() {
    annotations.forEach(sphere => scene.remove(sphere));
    annotations.length = 0;
  }

  let camera;
  let exerciseMode = '';

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

    clearAnnotations();

    if (results.poseLandmarks) {
      const poseLandmarks = results.poseLandmarks;
      let feedbackText = "";

      if (exerciseMode === 'push-up') {
        const elbowAngle = Math.abs(poseLandmarks[13].y - poseLandmarks[14].y);
        const shoulderAngle = Math.abs(poseLandmarks[11].y - poseLandmarks[12].y);

        if (elbowAngle > 0.3) {
          feedbackText = "❗ Push-Up Downward: Keep your arms bending!";
          addAnnotation(poseLandmarks[13].x * canvasElement.width, poseLandmarks[13].y * canvasElement.height);
        } else if (elbowAngle < 0.1 && shoulderAngle < 0.05) {
          feedbackText = "✅ Push-Up Up: Arms fully extended!";
        } else {
          feedbackText = "⚠️ Adjust your posture!";
          addAnnotation(poseLandmarks[13].x * canvasElement.width, poseLandmarks[13].y * canvasElement.height);
        }
      } else if (exerciseMode === 'squat') {
        const hipKneeAngle = Math.abs(poseLandmarks[23].y - poseLandmarks[25].y);
        const kneeAngle = Math.abs(poseLandmarks[25].y - poseLandmarks[26].y);

        if (hipKneeAngle < 0.3 && kneeAngle > 0.2) {
          feedbackText = "✅ Squat Down: Keep your knees aligned.";
        } else if (hipKneeAngle > 0.4 && kneeAngle < 0.1) {
          feedbackText = "✅ Squat Up: Stand tall!";
        } else {
          feedbackText = "⚠️ Squat form not detected properly!";
          addAnnotation(poseLandmarks[25].x * canvasElement.width, poseLandmarks[25].y * canvasElement.height);
        }
      }

      feedback.textContent = feedbackText;

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

    renderer.render(scene, camera3D);
    canvasCtx.restore();
  });

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
      clearAnnotations();
    }
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    toggleThemeCheckbox.checked = true;
  }

  toggleThemeCheckbox.addEventListener("change", () => {
    const isDark = toggleThemeCheckbox.checked;
    document.body.classList.toggle("dark-theme", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  startSquatBtn.addEventListener('click', () => {
    exerciseMode = 'squat';
    clearAnnotations();
    feedback.textContent = "🎯 Focus on your squat form.";
    poseStatus.textContent = "Pose: 🏋️ Squat Mode";
  });

  startPushUpBtn.addEventListener('click', () => {
    exerciseMode = 'push-up';
    clearAnnotations();
    feedback.textContent = "🎯 Focus on your push-up form.";
    poseStatus.textContent = "Pose: 💪 Push-Up Mode";
  });
});
