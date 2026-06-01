const video = document.getElementById('video');
const statusText = document.getElementById('status-text');

// 1. Ligar a webcam do utilizador
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        statusText.innerText = "Câmara ativa. A detetar rosto...";
    } catch (err) {
        console.error("Erro ao aceder à câmara: ", err);
        statusText.innerText = "Erro: Permissão de câmara negada.";
    }
}

// Inicializar a câmara assim que a página carregar
startVideo();