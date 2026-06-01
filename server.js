const express = require('express');
const app = express();
const PORT = 3000;

// Serve os ficheiros estáticos da pasta public
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});