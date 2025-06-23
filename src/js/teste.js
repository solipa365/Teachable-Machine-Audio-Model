
    const canvas = document.getElementById('voice-canvas');
    const ctx = canvas.getContext('2d');

    let audioContext;
    let analyser;
    let dataArray;

    function startAudio() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                source.connect(analyser);
                analyser.fftSize = 256;

                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                draw();
            })
            .catch(err => {
                console.error('Erro ao acessar o microfone:', err);
            });
    }

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();

        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

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

    // Chame esta função ao clicar no botão
    document.getElementById("toggle-button").addEventListener("click", startAudio);
