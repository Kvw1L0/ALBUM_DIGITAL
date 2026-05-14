// --- 1. Definir constantes y variables ---
const laminas = [
  "1. mi selfie",
  "2. Foto con mi líder de area",
  "3. Mi experiencia DDT"
];

let currentLamina = null;
let currentCard = null;
let stream = null;
let currentFacingMode = 'user'; 

let userId = localStorage.getItem('ddt_user_id');
if (!userId) {
    userId = 'ddt_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ddt_user_id', userId);
}

const globalCanvas = document.createElement('canvas');
const contenedor = document.getElementById('laminas');
const modalElement = document.getElementById('camera-modal');
const video = document.getElementById('video');
const tituloLamina = document.getElementById('titulo-lamina');

// --- 2. SISTEMA SENSORIAL (Audio, Vibración y Movimiento) ---

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'capture') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

// Detector de agitación
let lastX, lastY, lastZ;
let isGlitching = false;
function handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if(!acc) return;
    if(!lastX) { lastX = acc.x; lastY = acc.y; lastZ = acc.z; return; }
    
    let delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
    if(delta > 25 && !isGlitching) { // Umbral de fuerza (Agitar fuerte)
        triggerGlitch();
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
}

function triggerGlitch() {
    isGlitching = true;
    document.body.classList.add('glitch-active');
    vibrate([50, 50, 50]);
    playSound('click');
    setTimeout(() => {
        document.body.classList.remove('glitch-active');
        isGlitching = false;
    }, 400);
}

// --- 3. Funciones Principales ---

function iniciarAlbum() {
    initAudio(); 
    playSound('click');
    vibrate(50);
    
    // Solicitar permiso de giroscopio en iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === 'granted') window.addEventListener('devicemotion', handleMotion);
        }).catch(console.error);
    } else {
        window.addEventListener('devicemotion', handleMotion);
    }

    generarAlbum(); 
    document.getElementById('landing').classList.add('hidden'); 
    document.getElementById('contenido').classList.remove('hidden');
}
window.iniciarAlbum = iniciarAlbum;

function generarAlbum() {
    if (!contenedor || contenedor.children.length > 0) return;
    
    laminas.forEach(titulo => {
        const colDiv = document.createElement('div');
        colDiv.className = 'grid-col';
        
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        const innerFrame = document.createElement('div');
        innerFrame.className = 'inner-frame';
        
        const p = document.createElement('p');
        p.textContent = titulo;

        innerFrame.addEventListener('click', () => {
            playSound('click');
            vibrate(30);
            abrirCamara(titulo, innerFrame); 
        });

        cardDiv.appendChild(innerFrame);
        cardDiv.appendChild(p);
        colDiv.appendChild(cardDiv);
        contenedor.appendChild(colDiv);
    });
}

function cerrarStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        if (video) video.srcObject = null;
    }
}

async function iniciarCamara(facingMode) {
    cerrarStream(); 
    if (!video) return;

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
    } catch (error) {
        if (facingMode === 'environment') {
            currentFacingMode = 'user';
            iniciarCamara('user');
        } else {
            alert("No se pudo acceder a la cámara. Revisa los permisos.");
            cerrarModal(); 
        }
    }
}

function cambiarCamara() {
    playSound('click');
    vibrate(30);
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    iniciarCamara(currentFacingMode);
}
window.cambiarCamara = cambiarCamara;

function abrirCamara(titulo, cardRef) {
  currentLamina = titulo;
  currentCard = cardRef;
  if (tituloLamina) tituloLamina.textContent = titulo;
  
  if (modalElement) {
      modalElement.classList.remove('hidden');
      currentFacingMode = 'user';
      iniciarCamara(currentFacingMode);
  }
}

function cerrarModal() {
    if (modalElement) modalElement.classList.add('hidden');
    cerrarStream(); 
}
window.cerrarModal = cerrarModal;

function insertarImagen(dataUrl) {
  if (!currentCard) return;
  currentCard.innerHTML = ''; 
  currentCard.classList.add('has-photo');
  
  const img = document.createElement('img');
  img.src = dataUrl;
  currentCard.appendChild(img);
}

function capturarFoto() {
  if (!video) return;
  
  playSound('capture');
  vibrate(100); // Fuerte feedback al disparar
  
  globalCanvas.width = video.videoWidth || 640;
  globalCanvas.height = video.videoHeight || 480;
  const ctx = globalCanvas.getContext('2d');
  
  if (currentFacingMode === 'user') {
      ctx.translate(globalCanvas.width, 0);
      ctx.scale(-1, 1);
  }
  
  ctx.drawImage(video, 0, 0, globalCanvas.width, globalCanvas.height);
  const dataUrl = globalCanvas.toDataURL('image/jpeg', 0.7);
  
  insertarImagen(dataUrl);
  cerrarModal(); 
}
window.capturarFoto = capturarFoto;

function subirDesdeGaleria(event) {
  const file = event.target.files[0];
  if (!file) return;
  playSound('capture');
  const reader = new FileReader();
  reader.onload = function(e) { insertarImagen(e.target.result); };
  reader.readAsDataURL(file);
  cerrarModal(); 
}
window.subirDesdeGaleria = subirDesdeGaleria;

// --- SUBIR A FIREBASE ---
async function subirFotosAlServidor() {
    playSound('click');
    vibrate([30, 30, 30]);

    if (!window.db || !window.storage) {
        alert("Conectando con el servidor...");
        return;
    }

    const tarjetas = document.querySelectorAll('.card');
    const fotosParaSubir = [];

    tarjetas.forEach(card => {
        const img = card.querySelector('.inner-frame img'); 
        if (img && img.src && img.src.length > 100) { 
            fotosParaSubir.push({
                card: card,
                imgElement: img,
                categoria: card.querySelector('p').textContent
            });
        }
    });

    if (fotosParaSubir.length === 0) {
        alert("📸 Primero completa al menos una misión de tu álbum.");
        return;
    }
    
    const btn = document.getElementById('btn-share');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = `Enviando ${fotosParaSubir.length} fotos... ⏳`;

    let subidasExitosas = 0;

    for (const item of fotosParaSubir) {
        try {
            const timestamp = Date.now();
            const cleanCat = item.categoria.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const nombreArchivo = `DDT santander/${userId}_${cleanCat}_${timestamp}.jpg`; 
            
            const storageRef = window.sRef(window.storage, nombreArchivo);
            await window.sUpload(storageRef, item.imgElement.src, 'data_url');
            const urlPublica = await window.sGetUrl(storageRef);

            await window.dbAddDoc(window.dbCollection(window.db, "DDT santander"), {
                usuario: userId,
                categoria: item.categoria,
                url_foto: urlPublica,
                fecha: window.dbTimestamp()
            });

            subidasExitosas++;
            item.card.querySelector('.inner-frame').style.borderColor = '#28a745';
            item.card.querySelector('.inner-frame').style.boxShadow = '0 0 20px #28a745';

        } catch (error) {
            console.error("Error subiendo foto:", error);
            item.card.querySelector('.inner-frame').style.borderColor = '#ff0000';
        }
    }

    if (subidasExitosas > 0) {
        playSound('success');
        vibrate([100, 50, 100, 50, 200]); // Patrón de victoria
        alert(`¡Excelente! Se enviaron ${subidasExitosas} fotos a tu experiencia DDT 🎉`);
        btn.textContent = "¡Álbum Enviado! ✅";
        
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }, 5000);
    } else {
        alert("Hubo un error de conexión al subir las fotos.");
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}
window.subirFotosAlServidor = subirFotosAlServidor;
