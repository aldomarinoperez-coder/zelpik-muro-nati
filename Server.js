const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs'); // Librería para guardar archivos

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 🛠️ CONFIGURACIÓN DE CLOUDINARY
cloudinary.config({ 
  cloud_name: 'dbfpwj66a', 
  api_key: '112943158399347', 
  api_secret: 'EDOd1H3CZrhVnVuvS91J8bPToCg' 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zelpik_fotos',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
  },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// RUTAS
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'Index.html')); });
app.get('/muro', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'Pantalla.html')); });

// Ruta para subir fotos
app.post('/upload', upload.single('foto'), (req, res) => {
    if (req.file && req.file.path) {
        const urlFoto = req.file.path; 
        io.emit('nuevo_contenido', { tipo: 'foto', url: urlFoto });
        res.status(200).send('OK');
    } else {
        res.status(400).send('Error al subir');
    }
});

// GESTIÓN DE MENSAJES Y MEMORIA
io.on('connection', (socket) => {
    socket.on('nuevo_mensaje', (msg) => {
        // 1. Guardar en el archivo de texto para el agasajado
        const fecha = new Date().toLocaleString();
        const entradaLog = `[${fecha}] Mensaje: ${msg}\n`;
        
        fs.appendFile('MEMORIA_DEL_EVENTO.txt', entradaLog, (err) => {
            if (err) console.error("Error al guardar mensaje en el archivo:", err);
        });

        // 2. Emitir a la pantalla (tipo texto)
        io.emit('nuevo_contenido', { tipo: 'texto', mensaje: msg });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ ZELPIK ONLINE - MEMORIA ACTIVA`);
});
