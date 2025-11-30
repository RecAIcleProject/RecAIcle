// script.js
// Teachable Machine model URL (your model)
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YIf5c0Y8X/";

let model;
let webcam;
let webcamRunning = false;

let webcamContainer, uploadedImage, loading, predictionBox;

// -------------------------
// LOAD MODEL
// -------------------------
async function loadModel() {
  try {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    console.log("✔ Model loaded");
  } catch (err) {
    console.error("Model load error:", err);
    alert("Failed to load the model. Check console for details.");
  }
}

// -------------------------
// PREDICT
// -------------------------
async function predictFromElement(element) {
  if (!model) return;
  loading.classList.remove("hidden");
  try {
    const predictions = await model.predict(element);
    const best = predictions.reduce((a, b) => (a.probability > b.probability ? a : b));
    predictionBox.textContent = `${best.className} — ${(best.probability * 100).toFixed(1)}%`;
  } catch (err) {
    console.error("Prediction error:", err);
    predictionBox.textContent = "Prediction failed (see console).";
  } finally {
    loading.classList.add("hidden");
  }
}

// -------------------------
// START WEBCAM (with fallback)
// -------------------------
async function startWebcam() {
  uploadedImage.classList.add("hidden");

  try {
    // create webcam helper
    webcam = new tmImage.Webcam(320, 320, true);

    // try environment camera first, fallback to default/user
    try {
      await webcam.setup({ facingMode: "environment" });
    } catch (err) {
      console.warn("Environment camera unavailable — trying default camera.", err);
      await webcam.setup();
    }

    await webcam.play();
    webcamRunning = true;

    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    document.getElementById("startWebcamBtn").classList.add("hidden");
    document.getElementById("stopWebcamBtn").classList.remove("hidden");

    console.log("✔ Webcam started");
    window.requestAnimationFrame(loop);
  } catch (err) {
    console.error("Webcam start failed:", err);
    // Provide helpful message based on common errors
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      alert("Camera access was denied. Check browser site permissions (click the padlock in the address bar) and allow Camera access.");
    } else if (err.name === "NotFoundError") {
      alert("No camera found on this device.");
    } else {
      alert("Could not start camera: " + (err.message || err.name));
    }
  }
}

// -------------------------
// STOP WEBCAM
// -------------------------
function stopWebcam() {
  try {
    if (webcam) webcam.stop();
  } catch (e) {
    console.warn("Error stopping webcam:", e);
  }
  webcamRunning = false;
  webcamContainer.innerHTML = "";

  document.getElementById("startWebcamBtn").classList.remove("hidden");
  document.getElementById("stopWebcamBtn").classList.add("hidden");
  console.log("Webcam stopped");
}

// -------------------------
// LOOP
// -------------------------
async function loop() {
  if (!webcamRunning) return;
  try {
    webcam.update();
    await predictFromElement(webcam.canvas);
  } catch (err) {
    console.error("Loop error:", err);
  } finally {
    window.requestAnimationFrame(loop);
  }
}

// -------------------------
// IMAGE UPLOAD
// -------------------------
function handleImageUpload(event) {
  stopWebcam();
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  uploadedImage.onload = () => {
    URL.revokeObjectURL(url);
    predictFromElement(uploadedImage);
  };
  uploadedImage.src = url;
  uploadedImage.classList.remove("hidden");
  webcamContainer.innerHTML = "";
}

// -------------------------
// INIT
// -------------------------
window.addEventListener("load", async () => {
  webcamContainer = document.getElementById("webcam-container");
  uploadedImage = document.getElementById("uploadedImage");
  loading = document.getElementById("loading");
  predictionBox = document.getElementById("prediction-box");

  // show loading while model loads
  loading.classList.remove("hidden");
  await loadModel();
  loading.classList.add("hidden");

  // wire buttons
  document.getElementById("startWebcamBtn").addEventListener("click", startWebcam);
  document.getElementById("stopWebcamBtn").addEventListener("click", stopWebcam);
  document.getElementById("imageUpload").addEventListener("change", handleImageUpload);

  console.log("App initialized");
});
