// ==========================================
// 1. CONSTANTES Y ESTADO GLOBAL
// ==========================================
const laminas = [
  "1. Aquí estoy : mi selfie del evento",
  "2. Así se vivo mi experiencia",
  "3. Mi momento favorito"
];

let currentLamina = null;
let currentCard = null;
let stream = null;
let currentFacingMode = 'user'; 

let userId = 'ddt_' + Math.random().toString(36).substr(2, 9);
try {
    let storedId = localStorage.getItem('ddt_user_id');
    if (storedId) {
        userId = storedId;
    } else {
        localStorage.setItem('ddt_user_id', userId);
    }
} catch(e) {
    console.warn("Modo incógnito o restrictivo detectado.");
}

const globalCanvas = document.createElement('canvas');


// ==========================================
// 2. SISTEMA SENSORIAL (Audio y Vibración Seguros)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    try {
        if (!audioCtx && AudioContext) audioCtx = new AudioContext();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch(e) {}
}

function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;
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
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch(e) {}
}

function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e){}
}


// ==========================================
// 3. HUEVO DE PASCUA (Agitar o Tocar fondo)
// ==========================================
let lastX, lastY, lastZ;
let isGlitching = false;
let secretUnlocked = false;

function handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if(!acc) return;
    if(!lastX) { lastX = acc.x; lastY = acc.y; lastZ = acc.z; return; }
    
    let delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
    if(delta > 15 && !isGlitching) { 
        triggerGlitch();
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
}

let tapCount = 0;
document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    if(mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            if (e.target === mainContainer || e.target.classList.contains('grid-row')) {
                tapCount++;
                if (tapCount === 3) {
                    triggerGlitch(); 
                    tapCount = 0;
                }
                setTimeout(() => { tapCount = 0; }, 1500); 
            }
        });
    }
});

function triggerGlitch() {
    isGlitching = true;
    document.body.classList.add('glitch-active');
    vibrate([50, 50, 50]);
    playSound('click');
    
    if (!secretUnlocked) {
        secretUnlocked = true;
        setTimeout(() => {
            playSound('success');
            vibrate([100, 100, 200]);
            crearLaminaIndividual("4. Foto con cara de ganador 🏆");
            
            const containerScroll = document.querySelector('.container');
            if(containerScroll) containerScroll.scrollTop = containerScroll.scrollHeight;
        }, 500);
    }

    setTimeout(() => {
        document.body.classList.remove('glitch-active');
        isGlitching = false;
    }, 400);
}


// ==========================================
// 4. FLUJO PRINCIPAL DE LA APP
// ==========================================
function iniciarAlbum() {
    playSound('click');
    vibrate(50);
    
    try {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(state => {
                if (state === 'granted') window.addEventListener('devicemotion', handleMotion);
            }).catch(e => console.warn("Giroscopio bloqueado"));
        } else {
            window.addEventListener('devicemotion', handleMotion);
        }
    } catch(e) {}

    generarAlbum(); 
    
    const landing = document.getElementById('landing');
    const contenido = document.getElementById('contenido');
    if(landing) landing.classList.add('hidden'); 
    if(contenido) contenido.classList.remove('hidden');
}
window.iniciarAlbum = iniciarAlbum;

function generarAlbum() {
    const contenedor = document.getElementById('laminas');
    if (!contenedor || contenedor.children.length > 0) return;
    laminas.forEach(titulo => { crearLaminaIndividual(titulo); });
}

// CORRECCIÓN CRÍTICA JS: Quitamos el "shrink-in" del cardDiv para que no anule la rotación del CSS
function crearLaminaIndividual(titulo) {
    const colDiv = document.createElement('div');
    colDiv.className = 'grid-col';
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card'; // ¡AQUÍ ESTABA EL BUG! Lo limpiamos.
    
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
    
    const contenedor = document.getElementById('laminas');
    if (contenedor) contenedor.appendChild(colDiv);
}


// ==========================================
// 5. CONTROL DE CÁMARA
// ==========================================
function cerrarStream() {
    const video = document.getElementById('video');
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        if (video) video.srcObject = null;
    }
}

async function iniciarCamara(facingMode) {
    cerrarStream(); 
    const video = document.getElementById('video');
    if (!video) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("⚠️ SEGURIDAD: Cámara bloqueada. Recuerda probar esto desde Vercel (HTTPS).");
        cerrarModal();
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Error reproduciendo video:", e));
        };
    } catch (error) {
        console.warn("Fallo cámara:", error);
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
  const tituloLamina = document.getElementById('titulo-lamina');
  if (tituloLamina) tituloLamina.textContent = titulo;
  
  const modalElement = document.getElementById('camera-modal');
  if (modalElement) {
      modalElement.classList.remove('hidden');
      currentFacingMode = 'user';
      iniciarCamara(currentFacingMode);
  }
}

function cerrarModal() {
    const modalElement = document.getElementById('camera-modal');
    if (modalElement) modalElement.classList.add('hidden');
    cerrarStream(); 
}
window.cerrarModal = cerrarModal;


// ==========================================
// 6. CAPTURA Y PROCESAMIENTO
// ==========================================
function insertarImagen(dataUrl) {
  if (!currentCard) return;
  currentCard.innerHTML = ''; 
  currentCard.classList.add('has-photo');
  
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'shrink-in'; // CORRECCIÓN CRÍTICA: La animación va solo en la foto
  currentCard.appendChild(img);
}

function capturarFoto() {
  const video = document.getElementById('video');
  if (!video) return;
  
  const flash = document.getElementById('camera-flash');
  if(flash) {
      flash.classList.remove('hidden', 'flash-active');
      void flash.offsetWidth; 
      flash.classList.add('flash-active');
  }

  playSound('capture'); 
  vibrate(100); 
  
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
  vibrate(50);
  
  const reader = new FileReader();
  reader.onload = function(e) { insertarImagen(e.target.result); };
  reader.readAsDataURL(file);
  cerrarModal(); 
}
window.subirDesdeGaleria = subirDesdeGaleria;


// ==========================================
// 7. FIREBASE: SUBIDA DE FOTOS Y CONFETI FINAL
// ==========================================
async function subirFotosAlServidor() {
    playSound('click'); 
    vibrate([30, 30, 30]);

    if (!window.db || !window.storage) {
        alert("Conectando con el servidor... Intenta en unos segundos.");
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
            item.card.querySelector('.inner-frame').style.borderColor = '#fff';
            item.card.querySelector('.inner-frame').style.boxShadow = '0 0 25px #fff';

        } catch (error) {
            console.error("Error subiendo foto:", error);
            item.card.querySelector('.inner-frame').style.borderColor = '#ff0000';
            item.card.querySelector('.inner-frame').style.animation = 'none'; 
        }
    }

    if (subidasExitosas > 0) {
        playSound('success'); 
        vibrate([100, 50, 100, 50, 300]); 
        btn.textContent = "¡Álbum Enviado! ✅";
        
        try { localStorage.removeItem('ddt_user_id'); } catch(e){}
        
        const successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.remove('hidden');

        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '12px';
            confetti.style.height = '12px';
            confetti.style.backgroundColor = ['#EC0000', '#FFF', '#F0B90B', '#28a745'][Math.floor(Math.random() * 4)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            confetti.style.zIndex = '9999';
            confetti.style.borderRadius = (Math.random() > 0.5) ? '50%' : '2px';
            confetti.style.transition = 'transform 3s ease-in, top 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.style.top = '120vh';
                confetti.style.transform = `rotate(${Math.random() * 720}deg) translateX(${Math.random() * 100 - 50}px)`;
            }, 50);
            
            setTimeout(() => { confetti.remove(); }, 3500);
        }
        
    } else {
        alert("Hubo un error de conexión al subir las fotos.");
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}
window.subirFotosAlServidor = subirFotosAlServidor;
