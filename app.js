/* ================== GLOBAL ================== */
let mode = "live"; // live | capture | upload
const URL_PATH = "./my_model/";

let model, webcam;
let isModelLoaded = false;
let currentFacingMode = "environment";

/* ================== INIT ================== */
async function init() {
    const modelURL = URL_PATH + "model.json";
    const metadataURL = URL_PATH + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        isModelLoaded = true;
        console.log("Model loaded");

        await setupWebcam();
        requestAnimationFrame(loop);

    } catch (err) {
        console.error(err);
        alert("โหลดโมเดลไม่สำเร็จ");
    }
}

/* ================== WEBCAM ================== */
async function setupWebcam() {
    if (webcam) webcam.stop();

    webcam = new tmImage.Webcam(300, 300, true);
    await webcam.setup({ facingMode: currentFacingMode });
    await webcam.play();

    const container = document.getElementById("webcam-container");
    container.innerHTML = "";
    container.appendChild(webcam.canvas);
}

/* ================== LOOP ================== */
async function loop() {
    if (mode === "live" && webcam && isModelLoaded) {
        webcam.update();
        const prediction = await model.predict(webcam.canvas);
        renderResult(prediction);
    }
    requestAnimationFrame(loop);
}

/* ================== SWITCH CAMERA ================== */
async function switchCamera() {
    currentFacingMode =
        currentFacingMode === "environment" ? "user" : "environment";
    await setupWebcam();
}

/* ================== CAPTURE ================== */
async function captureImage() {
    if (!isModelLoaded || !webcam) return;
    const prediction = await model.predict(webcam.canvas);
    renderResult(prediction);
}

/* ================== UPLOAD ================== */
function triggerUpload() {
    document.getElementById("fileUpload").click();
}

document.getElementById("fileUpload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !isModelLoaded) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = async () => {
        const container = document.getElementById("webcam-container");
        container.innerHTML = "";
        img.style.width = "100%";
        img.style.maxWidth = "300px";
        img.style.borderRadius = "12px";
        container.appendChild(img);

        const prediction = await model.predict(img);
        renderResult(prediction);
        URL.revokeObjectURL(url);
    };
});

/* ================== RENDER RESULT ================== */
function renderResult(prediction) {
    const container = document.getElementById("label-container");
    container.innerHTML = "";

    const best = prediction.reduce((a, b) =>
        a.probability > b.probability ? a : b
    );

    const percent = (best.probability * 100).toFixed(1);
    const name = best.className.toLowerCase();

    let color = "#ff9800";
    if (name.includes("healthy")) color = "#4caf50";
    if (name.includes("blight") || name.includes("rust") || name.includes("spot"))
        color = "#f44336";

    container.innerHTML = `
        <div class="result-card">
            <div class="result-title">
                ${best.className} (${percent}%)
            </div>
            <div class="progress-bg">
                <div class="progress-fill"
                     style="width:${percent}%; background:${color}">
                </div>
            </div>
        </div>
    `;
}

/* ================== START ================== */
init();
