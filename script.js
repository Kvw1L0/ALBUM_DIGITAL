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

// Sistema de ID persistente (Evita pérdida de progreso si el BTL tiene mala red)
let userId = localStorage.getItem('ddt_user_id');
if (!userId) {
    userId = 'ddt_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ddt_user_id', userId);
}

// Canvas global para optimizar memoria al capturar fotos
const globalCanvas = document.createElement('canvas');

// Elementos del DOM
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
// 3. HUEVO DE PASCUA (Agitar o Tocar fondo)
// ==========================================
let lastX, lastY, lastZ;
let isGlitching = false;
let secretUnlocked = false;

// Detector de movimiento (Giroscopio)
function handleMotion(e) {
    const acc = e.accelerationIncludingGravity;
    if(!acc) return;
    if(!lastX) { lastX = acc.x; lastY = acc.y; lastZ = acc.z; return; }
    
    let delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
    // Umbral de 15 para detectar la agitación
    if(delta > 15 && !isGlitching) { 
        triggerGlitch();
    }
    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
}

// Cheat Code: 3 toques rápidos al FONDO (Plan B por si falla el giroscopio)
let tapCount = 0;
document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.container');
    if(mainContainer) {
        mainContainer.addEventListener('click', (e) => {
            // Solo cuenta si toca el contenedor vacío o la grilla, ignorando clics dentro de las fotos
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
    
    try { playSound('click'); } catch(e){}
    
    if (!secretUnlocked) {
        secretUnlocked = true;
        setTimeout(() => {
            try { playSound('success'); } catch(e){}
            vibrate([100, 100, 200]);
            crearLaminaIndividual("4. Foto con cara de ganador 🏆");
            
            // Scroll suave hacia abajo
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
    initAudio(); 
    try { playSound('click'); } catch(e){}
    vibrate(50);
    
    // Solicitar permiso de giroscopio en iOS
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
    card
