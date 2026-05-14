// --- 1. Definir constantes y variables de estado ---
// Ajustado a las 3 categorías solicitadas
const laminas = [
  "1. mi selfie",
  "2. Foto con mi líder de area",
  "3. Mi experiencia DDT"
];

let currentLamina = null;
let currentCard = null;
let stream = null;
let currentFacingMode = 'user'; 

// Sistema de ID persistente (Estilo Jungle: no pierde datos si recarga)
let userId = localStorage.getItem('ddt_user_id');
if (!userId) {
    userId = 'ddt_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ddt_user_id', userId);
}

// Canvas global para optimizar memoria al capturar
const globalCanvas = document.createElement('canvas');

// --- 2. Asignar variables de elementos ---
const contenedor = document.getElementById('laminas');
const modalElement = document.getElementById('camera-modal');
const video = document.getElementById('video');
const tituloLamina = document.getElementById('titulo-lamina');

// --- 3. Funciones Globales ---

function iniciarAlbum() {
  generarAlbum(); 
  const landing = document.getElementById('landing');
  const contenido = document.getElementById('contenido');
  
  if (landing && contenido) {
      landing.classList.add('hidden'); 
      contenido.classList.remove('hidden');
  }
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
        p.className = 'text-center';
        p.textContent = titulo;

        innerFrame.addEventListener('click', () => {
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
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode } // Removido 'exact' para mayor compatibilidad
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play().catch(e => console.error("Error play:", e));
        };
    } catch (error) {
        console.warn("Fallo cámara principal, intentando fallback:", error);
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
  currentCard.classList.add('has-photo'); // Oculta el texto de "Añadir foto"
  
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'shrink-in';
  currentCard.appendChild(img);
}

function capturarFoto() {
  if (!video) return;
  
  // Usar el canvas global
  globalCanvas.width = video.videoWidth || 640;
  globalCanvas.height = video.videoHeight || 480;
  const ctx = globalCanvas.getContext('2d');
  
  if (currentFacingMode === 'user') {
      ctx.translate(globalCanvas.width, 0);
      ctx.scale(-1, 1);
  }
  
  ctx.drawImage(video, 0, 0, globalCanvas.width, globalCanvas.height);
  
  // Comprimir un poco más para asegurar subidas rápidas (0.7)
  const dataUrl = globalCanvas.toDataURL('image/jpeg', 0.7);
  insertarImagen(dataUrl);
  cerrarModal(); 
}
window.capturarFoto = capturarFoto;

function subirDesdeGaleria(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    insertarImagen(e.target.result);
  };
  reader.readAsDataURL(file);
  cerrarModal(); 
}
window.subirDesdeGaleria = subirDesdeGaleria;

// --- SUBIR A FIREBASE (DDT SANTANDER) ---
async function subirFotosAlServidor() {
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
            // Limpiar nombre para la url del archivo
            const cleanCat = item.categoria.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            
            // LA CARPETA EN STORAGE: "DDT santander"
            const nombreArchivo = `DDT santander/${userId}_${cleanCat}_${timestamp}.jpg`; 
            
            const storageRef = window.sRef(window.storage, nombreArchivo);
            await window.sUpload(storageRef, item.imgElement.src, 'data_url');
            const urlPublica = await window.sGetUrl(storageRef);

            // LA COLECCIÓN EN FIRESTORE: "DDT santander"
            await window.dbAddDoc(window.dbCollection(window.db, "DDT santander"), {
                usuario: userId,
                categoria: item.categoria,
                url_foto: urlPublica,
                fecha: window.dbTimestamp()
            });

            subidasExitosas++;
            
            // Éxito: Borde verde y grueso
            item.card.querySelector('.inner-frame').style.borderColor = '#28a745';
            item.card.querySelector('.inner-frame').style.borderWidth = '6px';

        } catch (error) {
            console.error("Error subiendo foto:", error);
            item.card.querySelector('.inner-frame').style.borderColor = '#ff0000';
        }
    }

    if (subidasExitosas > 0) {
        alert(`¡Excelente! Se enviaron ${subidasExitosas} fotos a tu experiencia DDT 🎉`);
        btn.textContent = "¡Álbum Enviado! ✅";
        
        // Opcional: Limpiar el localStorage si quieres que empiecen de cero después de enviar
        // localStorage.removeItem('ddt_user_id');

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
