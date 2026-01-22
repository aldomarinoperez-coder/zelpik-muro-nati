const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Aseguramos que la carpeta uploads exista
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, 'zelpik-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Servimos archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.use(express.json());

// RUTAS PRINCIPALES
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'Index.html')); 
});

app.get('/muro', (req, res) => { 
    res.sendFile(path.join(__dirname, 'public', 'Pantalla.html')); 
});

app.get('/fotos-existentes', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.json([]);
        const fotos = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f)).map(f => `/uploads/${f}`);
        res.json(fotos);
    });
});

app.post('/upload', upload.single('foto'), (req, res) => {
    if (req.file) {
        const urlFoto = `/uploads/${req.file.filename}`;
        io.emit('nuevo_contenido', { tipo: 'foto', url: urlFoto });
        res.status(200).send('OK');
    } else { res.status(400).send('Error'); }
});

io.on('connection', (socket) => {
    socket.on('nuevo_mensaje', (msg) => {
        const fecha = new Date().toLocaleString();
        const registro = `[${fecha}] Mensaje: ${msg}\n`;
        fs.appendFile('mensajes_de_invitados.txt', registro, (err) => {
            if (err) console.error("Error al guardar mensaje");
        });
        io.emit('nuevo_contenido', { tipo: 'texto', mensaje: msg });
    });
});

// PUERTO DINÁMICO PARA RENDER
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ ZELPIK ONLINE EN PUERTO ${PORT}`);
});
