const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');
const poseStatus = document.getElementById('pose-status');
const feedback = document.getElementById('feedback');

// Load MediaPipe Pose
const pose = new Pose.Pose({
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
    poseStatus.textContent = 'Pose: Detected';

    // Draw green circles on keypoints
    results.poseLandmarks.forEach(landmark => {
      const x = landmark.x * canvasElement.width;
      const y = landmark.y * canvasElement.height;
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
      canvasCtx.fillStyle = "lime";
      canvasCtx.fill();
    });

    feedback.textContent = "Feedback: Ready to detect exercise!";
  } else {
    poseStatus.textContent = 'Pose: Not Detected';
    feedback.textContent = "Feedback: Please stand in front of camera.";
  }

  canvasCtx.restore();
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();
