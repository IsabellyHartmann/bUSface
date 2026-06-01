const video = document.getElementById('video');
const statusText = document.getElementById('status-text');
const statusBox = document.getElementById('status-box');
const spinner = document.getElementById('loading-spinner');
const scannerLine = document.querySelector('.scanner-line');

let labeledFaceDescriptors = [];
let faceMatcher = null;
let scanInterval = null;

// Alternar entre abas do MVP
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-content'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active-content');
    event.currentTarget.classList.add('active');

    if (tabName === 'admin') loadAdminData();
}

// 1. Inicializar Módulos de IA carregando caminhos absolutos protegidos do Codespaces
async function init() {
    try {
        const originUrl = window.location.origin + '/models';

        await faceapi.nets.tinyFaceDetector.loadFromUri(originUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(originUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(originUrl);

        statusText.innerText = "Módulos Biométricos Prontos. Sincronizando Base de Dados...";
        await preLoadUserDescriptors();
        startVideo();
    } catch (err) {
        console.error(err);
        showStatus("Erro crítico ao carregar IA. Verifique os caminhos do Codespace.", "error");
    }
}

// 2. Mapear fotos da BD para reconhecimento facial real
async function preLoadUserDescriptors() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        labeledFaceDescriptors = await Promise.all(
            users.map(async user => {
                try {
                    // Carrega a foto real enviada no registo
                    const img = await faceapi.fetchImage(user.fotoUrl);
                    const fullFaceDescription = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

                    if (fullFaceDescription) {
                        return new faceapi.LabeledFaceDescriptors(user.nome, [fullFaceDescription.descriptor]);
                    }
                } catch (e) {
                    console.error("Erro ao processar biometria para: " + user.nome, e);
                }
                return null;
            })
        );

        // Filtrar registos nulos
        labeledFaceDescriptors = labeledFaceDescriptors.filter(el => el !== null);

        if (labeledFaceDescriptors.length > 0) {
            // Cria o motor de comparação matemática de rostos (Threshold de precisão de 60%)
            faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
            showStatus("Aguardando aproximação de passageiro...", "scanning");
        } else {
            showStatus("Sem passageiros biométricos na BD. Registe um na aba superior.", "neutral");
        }
    } catch (err) {
        console.error("Erro na sincronização de dados:", err);
    }
}

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = stream;
    } catch (err) {
        showStatus("Acesso à câmara negado pelo dispositivo.", "error");
    }
}

// 3. Loop de Escaneamento e Validação em Tempo Real
video.addEventListener('play', () => {
    spinner.style.display = 'none';
    scannerLine.style.display = 'block';

    if (scanInterval) clearInterval(scanInterval);

    scanInterval = setInterval(async () => {
        if (video.paused || video.ended || !faceMatcher) return;

        // Captura o rosto da webcam
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

        if (detections.length > 0) {
            const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);

            if (bestMatch.label !== 'unknown') {
                // Rosto conhecido reconhecido de forma real! Comunicar com a API de Saldo
                clearInterval(scanInterval); // Pausa temporária para feedback visual profissional
                processAccess(bestMatch.label);
            } else {
                showStatus("⚠️ Rosto não identificado no Sistema.", "error");
            }
        } else {
            showStatus("Aproxime o rosto do painel...", "scanning");
        }
    }, 400);
});

async function processAccess(nomeUsuario) {
    try {
        const response = await fetch('/api/validate-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nomeUsuario })
        });
        const result = await response.json();

        if (result.authorized) {
            showStatus(`🎟️ AUTORIZADO: Boa Viagem ${result.nome}! [Saldo: ${result.saldoRestante}€]`, "success");
        } else {
            showStatus(`❌ RECUSADO: ${result.nome}. ${result.reason}`, "error");
        }
    } catch (e) {
        showStatus("Erro de rede ao validar título.", "error");
    }

    // Retoma o scanner após 4 segundos de exibição do resultado do torniquete
    setTimeout(() => {
        preLoadUserDescriptors();
    }, 4000);
}

function showStatus(text, type) {
    statusText.innerText = text;
    statusBox.className = `status-${type}`;
}

// 4. Tratamento do Formulário de Registo (Client-Side)
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const feedback = document.getElementById('form-feedback');

    feedback.innerText = "A processar biometria facial...";

    try {
        const response = await fetch('/api/register', { method: 'POST', body: formData });
        const resData = await response.json();

        if (resData.success) {
            feedback.innerHTML = `<span style="color:var(--success)">${resData.message}</span>`;
            e.target.reset();
            await preLoadUserDescriptors(); // Atualiza a IA imediatamente
        } else {
            feedback.innerHTML = `<span style="color:var(--error)">${resData.error}</span>`;
        }
    } catch (err) {
        feedback.innerText = "Erro ao conectar ao servidor bUSface.";
    }
});

// 5. Atualização da Tabela Estatística (Admin-Side)
async function loadAdminData() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = "<tr><td colspan='3'>A carregar dados confidenciais...</td></tr>";

    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        tbody.innerHTML = "";
        if (users.length === 0) {
            tbody.innerHTML = "<tr><td colspan='3'>Nenhum utilizador registado a bordo.</td></tr>";
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            const estado = user.saldo >= 1.45 ? "🟢 Ativo / Regularizado" : "🔴 Suspenso (Sem Saldo)";
            tr.innerHTML = `<td>${user.nome}</td><td>${user.saldo.toFixed(2)}€</td><td>${estado}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='3'>Erro ao ler estatísticas de tráfego.</td></tr>";
    }
}

init();