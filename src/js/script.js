const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Lx84jfhmy/";

let recognizer = null;
let labelContainer = null;
let isListening = false;

let audioContext;
let analyser;
let dataArray;
let drawAnimationId;

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-button");
  labelContainer = document.createElement("div");
  document.body.insertBefore(
    labelContainer,
    document.getElementById("voice-box")
  );
  toggleButton.addEventListener("click", toggleRecognition);
});

async function createModel() {
  const checkpointURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";

  const recognizer = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    checkpointURL,
    metadataURL
  );

  await recognizer.ensureModelLoaded();
  return recognizer;
}

async function toggleRecognition() {
  const toggleButton = document.getElementById("toggle-button");

  if (!isListening) {
    if (!(await hasMicrophonePermission())) return;

    if (!recognizer) {
      recognizer = await createModel();
    }

    const classLabels = recognizer.wordLabels();
    setupLabelDisplay(classLabels);

    recognizer.listen(
      (result) => {
        const scores = result.scores;
        scores.forEach((score, i) => {
          labelContainer.childNodes[i].innerHTML = `${
            classLabels[i]
          }: ${score.toFixed(2)}`;
        });
      },
      {
        includeSpectrogram: false,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.5,
      }
    );

    startAudioVisualizer();

    isListening = true;
    toggleButton.textContent = "Parar";
  } else {
    await recognizer.stopListening();
    stopAudioVisualizer();

    isListening = false;
    toggleButton.textContent = "Iniciar";
    labelContainer.innerHTML = "";
    console.log("Reconhecimento e visualização parados.");
  }
}

async function hasMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    alert("Permissão de microfone negada ou dispositivo não disponível.");
    return false;
  }
}

function setupLabelDisplay(labels) {
  labelContainer.innerHTML = "";
  labels.forEach(() => {
    labelContainer.appendChild(document.createElement("div"));
  });
}

function startAudioVisualizer() {
  const canvas = document.getElementById("voice-canvas");
  const ctx = canvas.getContext("2d");

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
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
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      draw();
    })
    .catch((err) => {
      console.error("Erro ao acessar o microfone:", err);
    });
}

function stopAudioVisualizer() {
  if (drawAnimationId) {
    cancelAnimationFrame(drawAnimationId);
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  const canvas = document.getElementById("voice-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
