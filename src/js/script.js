const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Lx84jfhmy/";

let recognizer = null;
let labelContainer = null;
let isListening = false;

document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggle-button");
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
        if (!await hasMicrophonePermission()) return;

        if (!recognizer) {
            recognizer = await createModel();
        }

        const classLabels = recognizer.wordLabels();
        labelContainer = document.getElementById("label-container");

        setupLabelDisplay(classLabels);

        recognizer.listen(result => {
            const scores = result.scores;
            scores.forEach((score, i) => {
                labelContainer.childNodes[i].innerHTML = `${classLabels[i]}: ${score.toFixed(2)}`;
            });
        }, {
            includeSpectrogram: false,
            probabilityThreshold: 0.75,
            invokeCallbackOnNoiseAndUnknown: true,
            overlapFactor: 0.5
        });

        isListening = true;
        toggleButton.textContent = "Parar";
    } else {
        await recognizer.stopListening();
        isListening = false;
        toggleButton.textContent = "Iniciar";
        labelContainer.innerHTML = "";
        console.log("Reconhecimento parado.");
    }

}

async function hasMicrophonePermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
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
