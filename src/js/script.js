const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Lx84jfhmy/";
const USE_CUSTOM_MODEL = true;

let recognizer = null;
let labelContainer = null;
let isListening = false;
let sharedStream = null;

let audioContext;
let analyser;
let dataArray;
let drawAnimationId;

let port, writer;

const toggleButton = document.getElementById("toggle-button");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("threshold-value");
const recognizedDisplay = document.getElementById("recognized-command");

thresholdSlider.addEventListener("input", () => {
  thresholdValue.textContent = thresholdSlider.value;
});

document.addEventListener("DOMContentLoaded", () => {
  labelContainer = document.getElementById("label-container");
  toggleButton.addEventListener("click", toggleRecognition);
});

// TeachableMachine ou local
async function createModel() {
  const base = USE_CUSTOM_MODEL ? CUSTOM_MODEL_URL : MODEL_URL;
  const checkpointURL = base + "model.json";
  const metadataURL = base + "metadata.json";

  const model = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    checkpointURL,
    metadataURL
  );

  await model.ensureModelLoaded();
  return model;
}

async function toggleRecognition() {
  if (!isListening) {
    try {
      sharedStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!recognizer) recognizer = await createModel();

      const classLabels = recognizer.wordLabels();
      setupLabelDisplay(classLabels);

      recognizer.listen(async (result) => {
        const scores = result.scores;
        let maxIndex = 0;
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] > scores[maxIndex]) maxIndex = i;
        }

        const predictedLabel = classLabels[maxIndex];
        const confidence = scores[maxIndex];

        recognizedDisplay.innerHTML = `Comando reconhecido: <strong>${predictedLabel}</strong>`;

        scores.forEach((score, i) => {
          labelContainer.childNodes[i].innerHTML = `${classLabels[i]}: ${score.toFixed(2)}`;
        });

        if (confidence >= 0.8 && writer) {
          await writer.write(new TextEncoder().encode(predictedLabel + "\n"));
          console.log("Enviado ao Arduino:", predictedLabel);
        }

      }, {
        includeSpectrogram: true,
        probabilityThreshold: parseFloat(thresholdSlider.value),
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5,
      });

      startAudioVisualizer(sharedStream);

      isListening = true;
      toggleButton.textContent = "Parar";
    } catch (err) {
      alert("Erro ao aceder ao microfone.");
    }
  } else {
    await recognizer.stopListening();
    stopAudioVisualizer();

    sharedStream.getTracks().forEach((track) => track.stop());
    sharedStream = null;

    isListening = false;
    toggleButton.textContent = "Iniciar";
    labelContainer.innerHTML = "";
    recognizedDisplay.innerHTML = "Comando reconhecido: <strong>Nenhum</strong>";
  }
}

function setupLabelDisplay(labels) {
  labelContainer.innerHTML = "";
  labels.forEach(() => {
    labelContainer.appendChild(document.createElement("div"));
  });
}

function startAudioVisualizer(stream) {
  const canvas = document.getElementById("voice-canvas");
  const ctx = canvas.getContext("2d");

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  function draw() {
    drawAnimationId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#007bff";
    ctx.beginPath();

    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  draw();
}

function stopAudioVisualizer() {
  if (drawAnimationId) cancelAnimationFrame(drawAnimationId);
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  const canvas = document.getElementById("voice-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function connectToArduino() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();

    listenToArduino(reader);
    alert("Conectado ao Arduino!");
  } catch (err) {
    alert("Erro ao ligar ao Arduino: " + err);
  }
}

async function listenToArduino(reader) {
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      console.log("[Serial] stream encerrado.");
      break;
    }
    if (value) {
      console.log("Arduino disse:", value);
    }
  }
}
