// URL do seu modelo Teachable Machine
const URL = "https://teachablemachine.withgoogle.com/models/Lx84jfhmy/";

async function createModel() {
    const checkpointURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    const recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined,
        checkpointURL,
        metadataURL
    );

    await recognizer.ensureModelLoaded();
    return recognizer;
}

async function init() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        alert("Permissão de microfone negada ou não disponível.");
        return;
    }

    const recognizer = await createModel();
    const classLabels = recognizer.wordLabels();
    const labelContainer = document.getElementById("label-container");

    labelContainer.innerHTML = "";
    for (let i = 0; i < classLabels.length; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    recognizer.listen(result => {
        const scores = result.scores;
        for (let i = 0; i < classLabels.length; i++) {
            const classPrediction = `${classLabels[i]}: ${scores[i].toFixed(2)}`;
            labelContainer.childNodes[i].innerHTML = classPrediction;
        }
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
    });

    // Parar automaticamente após 5 segundos (pode comentar se não quiser)
    // setTimeout(() => recognizer.stopListening(), 5000);
}
