const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configuração para guardar uploads de fotos dos utilizadores registados
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Guarda o ficheiro com o nome do utilizador para simular a BD
        const nomeFormatado = req.body.nome.toLowerCase().replace(/[^a-z0-9]/g, '_');
        cb(null, `${nomeFormatado}.jpg`);
    }
});
const upload = multer({ storage: storage });



// Middleware Essencial: Forçar Content-Type correto para ficheiros de pesos da IA
// Isto resolve definitivamente o erro crónico do Codespaces bloquear os shards
/*app.use('/models', (req, res, next) => {
    if (req.url.endsWith('.shard1')) {
        res.setHeader('Content-Type', 'application/octet-stream');
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}, express.static(path.join(__dirname, 'models')));*/


// Middleware para servir ficheiros estáticos e processar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use('/models', express.static('models'));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use(express.static(path.join(__dirname, 'public')));

// --- BANCO DE DADOS SIMULADO VIA FICHEIRO SISTEMA ---
const DB_PATH = path.join(__dirname, 'users_db.json');
function readDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// --- ROTAS DA API ---

// 1. Rota de Registo de Utilizador (Painel do Utilizador)
app.post('/api/register', upload.single('foto'), (req, res) => {
    try {
        const { nome, saldo } = req.body;
        if (!nome || !req.file) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const users = readDB();
        const newUser = {
            id: Date.now(),
            nome: nome,
            saldo: parseFloat(saldo) || 10.0,
            fotoUrl: `/uploads/${req.file.filename}`,
            registadoEm: new Date().toISOString()
        };

        users.push(newUser);
        writeDB(users);

        res.json({ success: true, message: "Utilizador registado com sucesso biométrico!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Rota para o Scanner obter todos os utilizadores registados e comparar os rostos
app.get('/api/users', (req, res) => {
    res.json(readDB());
});

// 3. Rota para debitar saldo após validação facial bem-sucedida
app.post('/api/validate-access', (req, res) => {
    const { nome } = req.body;
    const users = readDB();
    const userIndex = users.findIndex(u => u.nome.toLowerCase() === nome.toLowerCase());

    if (userIndex === -1) return res.status(404).json({ error: "Utilizador não encontrado." });

    const PRECO_VIAGEM = 1.45;
    if (users[userIndex].saldo >= PRECO_VIAGEM) {
        users[userIndex].saldo = parseFloat((users[userIndex].saldo - PRECO_VIAGEM).toFixed(2));
        writeDB(users);
        return res.json({
            authorized: true,
            nome: users[userIndex].nome,
            saldoRestante: users[userIndex].saldo
        });
    } else {
        return res.json({
            authorized: false,
            nome: users[userIndex].nome,
            reason: "Saldo Insuficiente. Por favor, carregue o seu passe."
        });
    }
});
// --- FIM DAS ROTAS DA API ---
app.listen(PORT, () => {
    console.log(`bUSface rodando em ambiente de produção na porta ${PORT}`);
});