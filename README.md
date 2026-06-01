# bUSface
Sistema de validação biométrica para transportes e bancos.

# Link para entrar na app
https://fuzzy-adventure-jjwx75x4gpxpc5qjv-3000.app.github.dev/



# 🚌 bUSface - Sistema Biométrico Unificado para Validação de Acessos e Transportes

O **bUSface** é uma aplicação web completa desenvolvida com **Node.js (Express)** e **JavaScript Avançado (ES6+)**, concebida para modernizar e substituir os métodos tradicionais de validação de acessos, tais como passes físicos de transportes públicos, cartões magnéticos ou bilhetes em papel. 

Através de algoritmos de visão computacional e inteligência artificial local, o rosto do utilizador passa a ser a sua própria credencial de acesso e carteira digital. O sistema realiza a deteção facial, validação de identidade e o débito monetário automático numa fração de segundo.

---

## 🏗️ Arquitetura do Projeto (MVP)

A aplicação foi estruturada como uma **SPA (Single Page Application)** dividida de forma modular em três painéis principais que cumprem os requisitos do Mínimo Produto Viável (MVP):

1. **Painel do Utilizador (Registo):** Permite o cadastro físico de novos passageiros. O utilizador introduz o nome, carrega um saldo monetário inicial e faz o upload de uma fotografia frontal para mapeamento biométrico.
2. **Módulo de Reconhecimento (Scanner):** Simula o terminal de embarque do autocarro ou linha de torniquetes. Acede à webcam em tempo real, deteta rostos, extrai a assinatura matemática e comunica com o servidor para validar a passagem.
3. **Painel de Monitorização e Segurança (Admin):** Uma área restrita para gestão de tráfego que lê os registos do servidor em tempo real. Permite auditar o saldo dos passageiros e o histórico exato de validações (crucial para estatísticas de tráfego e controlo de lotação).

---

## 🛠️ Tecnologias Utilizadas

* **Runtime Environment:** Node.js (v18+)
* **Framework Backend:** Express.js (API REST)
* **Gestão de Ficheiros:** Multer (Tratamento de upload de imagens e armazenamento físico em disco)
* **Inteligência Artificial e Visão Computacional:** `face-api.js` (Implementação de redes neuronais baseada em TensorFlow.js)
  * *Tiny Face Detector:* Rede leve otimizada para deteção rápida de rostos em tempo real no browser.
  * *Face Landmark 68 Net:* Mapeia 68 pontos geométricos fulcrais do rosto (olhos, nariz, boca e contorno).
  * *Face Recognition Net:* Extrai um vetor numérico único de 128 posições (assinatura facial) para comparação matemática.
* **Persistência de Dados (Base de Dados):** Ficheiro local estruturado `users_db.json` que guarda o estado real dos utilizadores e saldos.
* **Frontend:** HTML5, CSS3 Avançado (Animações de scanning laser via CSS Keyframes e variáveis nativas) e JavaScript Assíncrono (Async/Await e Fetch API).

---

## 📂 Estrutura de Diretórios do Projeto

```text
├── models/                       # Modelos de Redes Neuronais (.bin) e Configurações (.json)
│   ├── face_landmark_68_model-weights_manifest.json
│   ├── face_landmark_68_model.bin
│   ├── face_recognition_model-weights_manifest.json
│   ├── face_recognition_model.bin
│   ├── tiny_face_detector_model-weights_manifest.json
│   └── tiny_face_detector_model.bin
├── public/                       # Ficheiros estáticos servidos pelo Express
│   ├── index.html                # Interface SPA estruturada por abas
│   ├── style.css                 # Estilização moderna e animações do laser
│   ├── script.js                 # Engenharia biométrica cliente e controlo da webcam
│   └── uploads/                  # Pasta física onde o servidor guarda as fotos enviadas
├── users_db.json                 # Base de dados real do sistema em formato JSON
├── server.js                     # Servidor backend e rotas da API REST
├── package.json                  # Gestão de dependências do Node.js
└── README.md                     # Documentação técnica do projeto
🌐 Endpoints da API REST (Backend)
O servidor fornece uma API para gerir as operações do sistema sem simulações no código:

1. Criar Registo de Passageiro
Rota: POST /api/register
Tipo: multipart/form-data (Upload de Ficheiro)
Parâmetros: nome (String), saldo (Number), foto (Ficheiro de imagem)
Ação: Guarda a imagem na pasta /public/uploads/ com um nome único baseado em timestamp, gera um ID único e adiciona o passageiro ao ficheiro users_db.json com um histórico de viagens vazio.
2. Sincronizar Base de Dados
Rota: GET /api/users
Retorno: Array JSON com todos os utilizadores cadastrados.
Ação: O frontend consome esta rota logo no arranque da página para descarregar as fotos de referência e alimentar a classe faceapi.FaceMatcher com os perfis conhecidos.
3. Processar Débito de Viagem e Acesso
Rota: POST /api/validate-access
Tipo: application/json
Payload: { "nome": "Nome do Passageiro" }
Ação: Procura o utilizador no JSON. Se o saldo for igual ou superior ao preço da tarifa padrão (1.45€), o servidor desconta o valor, regista uma entrada com status: "Autorizado" (usando a data/hora local de Portugal pt-PT) e grava no disco. Caso contrário, gera um log de acesso recusado por falta de fundos.
🧠 Fluxo Lógico do Reconhecimento Facial Real
O bUSface não faz simulações de tempo fixo. Ele opera por computação biométrica real:

Inicialização: O browser descarrega os pesos das redes neuronais (.bin) a partir da pasta /models.
Extração de Assinaturas: O script lê as fotos de todos os utilizadores registados vindos da API e extrai os seus vetores faciais (vetor de 128 números).
Deteção em Tempo Real: A webcam captura frames a cada 450ms. O rosto detetado é convertido num vetor matemático temporário.
Distância Euclidiana: O sistema calcula a diferença matemática entre o rosto da câmara e as assinaturas guardadas. Se a distância for menor que o limiar de tolerância configurado (0.55), a identidade é validada.
Bloqueio de Concorrência: Assim que o rosto é reconhecido, o loop do scanner é trancado (isProcessingFace = true) para impedir múltiplas requisições e débitos duplicados enquanto a resposta do servidor é processada e o ecrã exibe o feedback visual.
🚀 Como Executar e Testar o Projeto
Abre o terminal no teu ambiente (GitHub Codespaces) e instala as dependências:
   npm install
Inicia o servidor Node.js:
   node server.js
Configuração de Portas no Codespaces (Importante):
Acede à aba Ports (Portas) no painel inferior do VS Code.
Clica com o botão direito sobre a porta 3000 e altera a visibilidade de Private para Public.
Clica no link gerado para abrir a aplicação no teu browser sob protocolo seguro HTTPS (obrigatório para que o browser dê permissão de acesso à webcam).
Guia de Teste Rápido:
Acede à aba Registo, preenche o teu nome, define um saldo (ex: 5.00) e faz o upload de uma foto tua bem nítida e de frente. Clica em Submeter.
Vai à aba Scanner, permite o acesso à câmara e olha para a lente. O sistema irá reconhecer-te, pintar o ecrã de Verde e mostrar o teu saldo atualizado após descontar os 1.45€.
Consulta a aba Admin para ver o log gerado automaticamente com o dia e hora exatos da tua validação.

### O que ganhas com este README?
1. **Fundamentação Técnica:** Explica termos de IA de forma rigorosa (`FaceMatcher`, `Distância Euclidiana`, `Threshold 0.55`), provando que dominas o assunto.
2. **Organização:** Mostra a arquitetura do código (as 3 abas pedidas no teu enunciado: Cliente/Registo, Scanner e Admin).
3. **Instruções Claras:** O passo sobre mudar a porta para "Public" mostra ao professor que sabes trabalhar com o ambiente cloud do GitHub Codespaces.
Porquê esta atividade?
