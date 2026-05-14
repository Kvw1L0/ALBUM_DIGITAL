// ==========================================
// 1. CONSTANTES Y ESTADO GLOBAL
// ==========================================
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


// ==========================================
// 2. SISTEMA SENSORIAL (Audio y Vibración)
// ==========================================
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
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

// ==========================================
// 3. HUEVO DE PASCUA (Agitar o Tocar 3 veces)
// ==========================================
let lastX, lastY, lastZ;
let isGlitching = false;
let secretUnlocked = false;

// Detector de movimiento más sensible (15)
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

// Cheat Code: 3 toques rápidos al título
let tapCount = 0;
document.addEventListener('DOMContentLoaded', () => {
    const tituloAlbum = document.querySelector('.container h1.text-center');
    if(tituloAlbum) {
        tituloAlbum.addEventListener('click', () => {
            tapCount++;
            if (tapCount === 3) {
                triggerGlitch(); 
                tapCount = 0;
            }
            setTimeout(() => { tapCount = 0; }, 1500); 
        });
    }
});

function triggerGlitch() {
    isGlitching = true;
    document.body.classList.add('glitch-active');
    vibrate([50, 50, 50]);
    
    try { playSound('click'); } catch(e){}
    
    if (!secretUnlocked) {
        secretUnlocked = true;
        setTimeout(() => {
            try { playSound('success'); } catch(e){}
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
// 4. FLUJO PRINCIPAL Y CÁMARA A PRUEBA DE FALLOS
// ==========================================

function iniciarAlbum() {
    initAudio(); 
    try { playSound('click'); } catch(e){}
    vibrate(50);
    
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
    laminas.forEach(titulo => { crearLaminaIndividual(titulo); });
}

function crearLaminaIndividual(titulo) {
    const colDiv = document.createElement('div');
    colDiv.className = 'grid-col';
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card shrink-in'; 
    const innerFrame = document.createElement('div');
    innerFrame.className = 'inner-frame';
    const p = document.createElement('p');
    p.textContent = titulo;

    innerFrame.addEventListener('click', () => {
        try { playSound('click'); } catch(e) { console.warn("Audio ignorado"); }
        try { vibrate(30); } catch(e) {}
        abrirCamara(titulo, innerFrame); 
    });

    cardDiv.appendChild(innerFrame);
    cardDiv.appendChild(p);
    colDiv.appendChild(cardDiv);
    if (contenedor) contenedor.appendChild(colDiv);
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("⚠️ SEGURIDAD: Cámara bloqueada. Debes probar en Vercel (HTTPS) o Live Server.");
        cerrarModal();
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode } });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Error video:", e));
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
    try { playSound('click'); } catch(e){}
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

// ==========================================
// 5. CAPTURA Y PROCESAMIENTO
// ==========================================
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
  
  try { playSound('capture'); } catch(e){}
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
  
  try { playSound('capture'); } catch(e){}
  vibrate(50);
  
  const reader = new FileReader();
  reader.onload = function(e) { insertarImagen(e.target.result); };
  reader.readAsDataURL(file);
  cerrarModal(); 
}
window.subirDesdeGaleria = subirDesdeGaleria;


// ==========================================
// 6. FIREBASE Y CONFETI FINAL
// ==========================================
async function subirFotosAlServidor() {
    try { playSound('click'); } catch(e){}
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
        try { playSound('success'); } catch(e){}
        vibrate([100, 50, 100, 50, 300]); 
        btn.textContent = "¡Álbum Enviado! ✅";
        localStorage.removeItem('ddt_user_id');
        
        const successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.remove('hidden');

        // EFECTO WOW: Lluvia de confeti
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
