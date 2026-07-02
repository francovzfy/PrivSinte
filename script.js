// =========================================================================
// INTERFAZ EN NUBE: AUTHENTICATION
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg8xVWU1X8dr6dgT_Hw_ehOsEYU4rEHhY",
  authDomain: "fir-fisica-38f5c.firebaseapp.com",
  projectId: "fir-fisica-38f5c",
  storageBucket: "fir-fisica-38f5c.firebasestorage.app",
  messagingSenderId: "131595014504",
  appId: "1:131595014504:web:dcf0b5f7f4f85b529186dd",
  measurementId: "G-6VYJWM4SW7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variables de Contexto de Sonido
let audioCtx = null;
const activeNotes = new Map();
let isAccessGranted = false; 

const triggers = [
    { id: 'T1', type: 'white', key: 'a' }, { id: 'T2', type: 'black', key: 'w' },
    { id: 'T3', type: 'white', key: 's' }, { id: 'T4', type: 'black', key: 'e' },
    { id: 'T5', type: 'white', key: 'd' }, { id: 'T6', type: 'white', key: 'f' },
    { id: 'T7', type: 'black', key: 't' }, { id: 'T8', type: 'white', key: 'g' },
    { id: 'T9', type: 'black', key: 'y' }, { id: 'T10', type: 'white', key: 'h' },
    { id: 'T11', type: 'black', key: 'u' }, { id: 'T12', type: 'white', key: 'j' }
];

// Nodos de control DOM (Captura General)
const pianoElement = document.getElementById('piano');
const waveA = document.getElementById('waveA'); const inputA = document.getElementById('hz-input-A'); const sliderA = document.getElementById('hz-slider-A');
const waveB = document.getElementById('waveB'); const inputB = document.getElementById('hz-input-B'); const sliderB = document.getElementById('hz-slider-B');
const waveC = document.getElementById('waveC'); const inputC = document.getElementById('hz-input-C'); const sliderC = document.getElementById('hz-slider-C');

const volA = document.getElementById('vol-slider-A'); const volTextA = document.getElementById('vol-text-A');
const volB = document.getElementById('vol-slider-B'); const volTextB = document.getElementById('vol-text-B');
const volC = document.getElementById('vol-slider-C'); const volTextC = document.getElementById('vol-text-C');

const noiseType = document.getElementById('noise-type'); const noiseVolume = document.getElementById('noise-volume'); const noiseVolText = document.getElementById('noise-vol-text');

const muteA = document.getElementById('muteA'); const muteB = document.getElementById('muteB'); const muteC = document.getElementById('muteC'); const muteNoise = document.getElementById('muteNoise');

const filterTypeSelect = document.getElementById('filter-type'); const filterCutoffSlider = document.getElementById('filter-cutoff'); const filterQSlider = document.getElementById('filter-q');
const cutoffText = document.getElementById('cutoff-text'); const qText = document.getElementById('q-text');

const authSection = document.getElementById('auth-section'); const userSection = document.getElementById('user-section');
const synthContent = document.getElementById('synth-content');
const authEmail = document.getElementById('auth-email'); const authPassword = document.getElementById('auth-password');
const userDisplay = document.getElementById('user-display');
const btnLogin = document.getElementById('btn-login'); const btnRegister = document.getElementById('btn-register'); const btnLogout = document.getElementById('btn-logout');

// =========================================================================
// CONTROLADORES DE EVENTO DE SESIÓN (MODULARES FIJOS)
// =========================================================================
btnRegister.addEventListener('click', async () => {
    const email = authEmail.value.trim(); const password = authPassword.value;
    if(!email || !password) return alert("Por favor ingresa correo y contraseña.");
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("¡Cuenta creada con éxito!");
    } catch (error) { alert("Error al registrarse: " + error.message); }
});

btnLogin.addEventListener('click', async () => {
    const email = authEmail.value.trim(); const password = authPassword.value;
    if(!email || !password) return alert("Ingresa tus datos de acceso.");
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (error) { alert("Credenciales incorrectas: " + error.message); }
});

btnLogout.addEventListener('click', async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
});

// Guardián del sintetizador: Bloquea y oculta la app hasta que verifique la cuenta
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        synthContent.classList.remove('hidden'); 
        userDisplay.textContent = user.email;
        isAccessGranted = true;
    } else {
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        synthContent.classList.add('hidden'); 
        userDisplay.textContent = "";
        isAccessGranted = false;
        activeNotes.forEach((note, id) => stopTrigger({ id }));
    }
});

// =========================================================================
// MOTOR DE AUDIO TOTALMENTE COMPATIBLE Y AUDIBLE
// =========================================================================
function createNoiseBuffer(type) {
    if (!audioCtx) return null;
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'white') { output[i] = white; } 
        else if (type === 'pink') {
            b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856; b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362; output[i] *= 0.11; b6 = white * 0.115926;
        } else if (type === 'brown') { output[i] = (lastOut + (0.02 * white)) / 1.02; lastOut = output[i]; output[i] *= 3.5; }
    }
    return noiseBuffer;
}

// Renderizar las teclas asegurándonos de amarrar los eventos dinámicamente
triggers.forEach(t => {
    const keyDiv = document.createElement('div'); 
    keyDiv.className = `key ${t.type}`; 
    keyDiv.dataset.trigger = t.id;
    
    // Listeners del mouse explícitos
    keyDiv.addEventListener('mousedown', () => startTrigger(t));
    keyDiv.addEventListener('mouseup', () => stopTrigger(t));
    keyDiv.addEventListener('mouseleave', () => stopTrigger(t));
    pianoElement.appendChild(keyDiv);
});

function startTrigger(trigger) {
    if (!isAccessGranted) return; 
    if (activeNotes.has(trigger.id)) return;
    
    // Inicialización segura del motor al interactuar
    if (!audioCtx) { 
        audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscA = audioCtx.createOscillator(); const oscB = audioCtx.createOscillator(); const oscC = audioCtx.createOscillator(); const noiseNode = audioCtx.createBufferSource();
    const biquadFilter = audioCtx.createBiquadFilter(); const noteGain = audioCtx.createGain();
    const gainNodeA = audioCtx.createGain(); const gainNodeB = audioCtx.createGain(); const gainNodeC = audioCtx.createGain(); const gainNodeNoise = audioCtx.createGain();

    oscA.type = waveA.value; oscA.frequency.value = parseFloat(inputA.value) || 20;
    oscB.type = waveB.value; oscB.frequency.value = parseFloat(inputB.value) || 20;
    oscC.type = waveC.value; oscC.frequency.value = parseFloat(inputC.value) || 20;

    biquadFilter.type = filterTypeSelect.value;
    biquadFilter.frequency.setValueAtTime(parseFloat(filterCutoffSlider.value), audioCtx.currentTime);
    biquadFilter.Q.setValueAtTime(parseFloat(filterQSlider.value), audioCtx.currentTime);

    // Ganancias de mezcla (0 a 1)
    gainNodeA.gain.value = (parseFloat(volA.value) / 100) * 0.12;
    gainNodeB.gain.value = (parseFloat(volB.value) / 100) * 0.12;
    gainNodeC.gain.value = (parseFloat(volC.value) / 100) * 0.12;
    gainNodeNoise.gain.value = (parseFloat(noiseVolume.value) / 100) * 0.12;

    const noiseBuffer = createNoiseBuffer(noiseType.value);
    if (noiseBuffer) { noiseNode.buffer = noiseBuffer; noiseNode.loop = true; }
    noteGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

    // Sistema de conexión condicionado por interruptor (Switch)
    if (muteA.checked) { oscA.connect(gainNodeA); gainNodeA.connect(biquadFilter); }
    if (muteB.checked) { oscB.connect(gainNodeB); gainNodeB.connect(biquadFilter); }
    if (muteC.checked) { oscC.connect(gainNodeC); gainNodeC.connect(biquadFilter); }
    if (muteNoise.checked) { noiseNode.connect(gainNodeNoise); gainNodeNoise.connect(biquadFilter); }

    biquadFilter.connect(noteGain); 
    noteGain.connect(audioCtx.destination);
    
    oscA.start(); oscB.start(); oscC.start(); noiseNode.start();

    activeNotes.set(trigger.id, { oscA, oscB, oscC, noiseNode, gainNodeA, gainNodeB, gainNodeC, gainNodeNoise, biquadFilter, noteGain });
    document.querySelector(`[data-trigger="${trigger.id}"]`)?.classList.add('active');
}

function stopTrigger(trigger) {
    if (activeNotes.has(trigger.id)) {
        const { oscA, oscB, oscC, noiseNode, noteGain } = activeNotes.get(trigger.id);
        const rel = 0.05;
        if(audioCtx) {
            noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + rel);
            oscA.stop(audioCtx.currentTime + rel); oscB.stop(audioCtx.currentTime + rel); oscC.stop(audioCtx.currentTime + rel); noiseNode.stop(audioCtx.currentTime + rel);
        }
        activeNotes.delete(trigger.id);
        document.querySelector(`[data-trigger="${trigger.id}"]`)?.classList.remove('active');
    }
}

// Modulaciones dinámicas en vivo
filterTypeSelect.addEventListener('change', (e) => { activeNotes.forEach(n => { n.biquadFilter.type = e.target.value; }); });
filterCutoffSlider.addEventListener('input', (e) => { cutoffText.textContent = `${e.target.value} Hz`; activeNotes.forEach(n => { n.biquadFilter.frequency.setValueAtTime(e.target.value, audioCtx.currentTime); }); });
filterQSlider.addEventListener('input', (e) => { qText.textContent = e.target.value; activeNotes.forEach(n => { n.biquadFilter.Q.setValueAtTime(e.target.value, audioCtx.currentTime); }); });

volA.addEventListener('input', (e) => { volTextA.textContent = `${e.target.value}%`; activeNotes.forEach(n => { n.gainNodeA.gain.value = (e.target.value / 100) * 0.12; }); });
volB.addEventListener('input', (e) => { volTextB.textContent = `${e.target.value}%`; activeNotes.forEach(n => { n.gainNodeB.gain.value = (e.target.value / 100) * 0.12; }); });
volC.addEventListener('input', (e) => { volTextC.textContent = `${e.target.value}%`; activeNotes.forEach(n => { n.gainNodeC.gain.value = (e.target.value / 100) * 0.12; }); });
noiseVolume.addEventListener('input', (e) => { noiseVolText.textContent = `${e.target.value}%`; activeNotes.forEach(n => { n.gainNodeNoise.gain.value = (e.target.value / 100) * 0.12; }); });

const setupSync = (slider, input) => {
    slider.addEventListener('input', (e) => input.value = e.target.value);
    input.addEventListener('input', (e) => { let val = Math.min(Math.max(parseInt(e.target.value) || 20, 20), 20000); slider.value = val; });
};
setupSync(sliderA, inputA); setupSync(sliderB, inputB); setupSync(sliderC, inputC);

// Teclado Alfanumérico Físico QWERTY
window.addEventListener('keydown', (e) => { 
    if(!isAccessGranted) return;
    if(!e.repeat) { 
        const t = triggers.find(x => x.key === e.key.toLowerCase()); 
        if(t) startTrigger(t); 
    } 
});
window.addEventListener('keyup', (e) => { 
    if(!isAccessGranted) return;
    const t = triggers.find(x => x.key === e.key.toLowerCase()); 
    if(t) stopTrigger(t); 
});