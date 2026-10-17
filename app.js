
// ==========================================
// 1. GLOBAL SETTINGS & API KEYS
// ==========================================
// यहाँ अपनी API Keys डालें जो पेड या रजिस्टर्ड हैं
const REMOVE_BG_API_KEY = 'YOUR_REMOVE_BG_API_KEY'; 
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
const NEWSDATA_API_KEY = 'YOUR_NEWSDATA_API_KEY';

// ==========================================
// 2. CANVAS INITIALIZATION & RESPONSIVENESS
// ==========================================
const canvas = new fabric.Canvas('newsCanvas', {
    preserveObjectStacking: true,
    backgroundColor: '#1f2937'
});

let stateHistory = [];
let currentStateIndex = -1;

function resizeCanvas() {
    const workspace = document.getElementById('workspace');
    // 1:1 Aspect Ratio Canvas (Facebook/Insta default)
    const size = Math.min(workspace.clientWidth - 20, workspace.clientHeight - 20, 1080);
    canvas.setWidth(size);
    canvas.setHeight(size);
    canvas.renderAll();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// 3. AUTO-SAVE & UNDO/REDO (LOCAL STORAGE)
// ==========================================
function saveState() {
    if (currentStateIndex < stateHistory.length - 1) {
        stateHistory = stateHistory.slice(0, currentStateIndex + 1);
    }
    const json = canvas.toJSON();
    stateHistory.push(json);
    currentStateIndex++;
    localStorage.setItem('newsDraftPro', JSON.stringify(json));
}

function loadState() {
    const draft = localStorage.getItem('newsDraftPro');
    if (draft) {
        canvas.loadFromJSON(draft, () => {
            canvas.renderAll();
            stateHistory.push(JSON.parse(draft));
            currentStateIndex = 0;
        });
    }
}

document.getElementById('undoBtn').addEventListener('click', () => {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        canvas.loadFromJSON(stateHistory[currentStateIndex], canvas.renderAll.bind(canvas));
    }
});

document.getElementById('redoBtn').addEventListener('click', () => {
    if (currentStateIndex < stateHistory.length - 1) {
        currentStateIndex++;
        canvas.loadFromJSON(stateHistory[currentStateIndex], canvas.renderAll.bind(canvas));
    }
});

canvas.on('object:modified', saveState);
canvas.on('object:added', saveState);
canvas.on('object:removed', saveState);
window.onload = loadState;

// ==========================================
// 4. BOTTOM SHEET & LAYER SETTINGS (PicsArt UI)
// ==========================================
canvas.on('selection:created', showBottomSheet);
canvas.on('selection:updated', showBottomSheet);
canvas.on('selection:cleared', hideBottomSheet);

function showBottomSheet() {
    const obj = canvas.getActiveObject();
    if(obj) {
        document.getElementById('bottomSheet').classList.remove('hidden');
        document.getElementById('opacitySlider').value = obj.opacity || 1;
        document.getElementById('strokeSlider').value = obj.strokeWidth || 0;
    }
}

function hideBottomSheet() {
    document.getElementById('bottomSheet').classList.add('hidden');
}

document.getElementById('closeSheet').addEventListener('click', hideBottomSheet);

// Sliders Logic
document.getElementById('opacitySlider').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if(obj) { obj.set('opacity', parseFloat(e.target.value)); canvas.renderAll(); }
});

document.getElementById('shadowSlider').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if(obj) {
        const val = parseInt(e.target.value);
        obj.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: val, offsetX: val/2, offsetY: val/2 }));
        canvas.renderAll();
    }
});

document.getElementById('strokeSlider').addEventListener('input', (e) => {
    const obj = canvas.getActiveObject();
    if(obj && obj.type === 'textbox') {
        obj.set({ stroke: document.getElementById('strokeColor').value, strokeWidth: parseInt(e.target.value) });
        canvas.renderAll();
    }
});

// Z-Index & Clone Logic
function bringFront() { const obj = canvas.getActiveObject(); if(obj) { canvas.bringToFront(obj); saveState(); } }
function sendBack() { const obj = canvas.getActiveObject(); if(obj) { canvas.sendToBack(obj); saveState(); } }
function deleteObj() { const obj = canvas.getActiveObject(); if(obj) { canvas.remove(obj); hideBottomSheet(); } }
function cloneObj() {
    const obj = canvas.getActiveObject();
    if(obj) {
        obj.clone((cloned) => {
            cloned.set({ left: obj.left + 20, top: obj.top + 20, evented: true });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
        });
    }
}
function toggleLock() {
    const obj = canvas.getActiveObject();
    if(obj) {
        const isLocked = obj.lockMovementX;
        obj.set({ lockMovementX: !isLocked, lockMovementY: !isLocked, lockRotation: !isLocked, lockScalingX: !isLocked, lockScalingY: !isLocked, selectable: isLocked });
        canvas.discardActiveObject(); canvas.renderAll();
    }
}

// ==========================================
// 5. CORE EDITOR TOOLS (Text, Image, Shapes)
// ==========================================
function addTextLayer(customText = "यहाँ ब्रेकिंग न्यूज़ लिखें") {
    const text = new fabric.Textbox(customText, {
        left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center',
        fontFamily: 'Mukta', fontSize: canvas.width * 0.08, fill: '#ffffff', fontWeight: 'bold',
        textAlign: 'center', width: canvas.width * 0.8
    });
    canvas.add(text);
    canvas.setActiveObject(text);
}

document.getElementById('imageUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
        fabric.Image.fromURL(f.target.result, (img) => {
            img.scaleToWidth(canvas.width);
            img.set({ left: canvas.width/2, top: canvas.height/2, originX: 'center', originY: 'center' });
            canvas.add(img);
            canvas.sendToBack(img); // Background ke taur par default
        });
    };
    reader.readAsDataURL(file);
});

function addShapes() {
    const rect = new fabric.Rect({
        left: canvas.width/2, top: canvas.height - 100, originX: 'center', originY: 'center',
        fill: '#cc0000', width: canvas.width, height: 80, opacity: 0.9
    });
    canvas.add(rect);
}

// ==========================================
// 6. ALL 10+ API INTEGRATIONS
// ==========================================

// 1. Web Speech API (Voice to Text in Hindi)
function startVoiceTyping() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) return alert("आपका ब्राउज़र वॉइस टाइपिंग सपोर्ट नहीं करता।");
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.start();
    alert("बोलना शुरू करें...");
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addTextLayer(transcript);
    };
}

// 2. Translate API (MyMemory - Free)
async function translateText() {
    const obj = canvas.getActiveObject();
    if(!obj || obj.type !== 'textbox') return alert("पहले कोई टेक्स्ट सेलेक्ट करें।");
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(obj.text)}&langpair=hi|en`);
        const data = await res.json();
        obj.set('text', data.responseData.translatedText);
        canvas.renderAll();
        saveState();
    } catch(e) { alert("ट्रांसलेशन फेल हुआ।"); }
}

// 3. Remove.bg API (Background Removal)
async function removeBackground() {
    const obj = canvas.getActiveObject();
    if(!obj || obj.type !== 'image') return alert("पहले कोई फोटो सेलेक्ट करें।");
    if(REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY') return alert("कृपया 코드 में Remove.bg API Key डालें।");
    
    alert("बैकग्राउंड हटाया जा रहा है, कृपया प्रतीक्षा करें...");
    try {
        const formData = new FormData();
        formData.append('image_url', obj.getSrc());
        formData.append('size', 'auto');
        
        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
            body: formData
        });
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        
        fabric.Image.fromURL(url, (newImg) => {
            newImg.set({ left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY });
            canvas.remove(obj);
            canvas.add(newImg);
            canvas.setActiveObject(newImg);
        });
    } catch(e) { alert("एरर! कृपया चेक करें कि इमेज URL पब्लिक है या नहीं। लोकल इमेज के लिए File Upload लॉजिक API में भेजना होगा।"); }
}

// 4. IP Geolocation API (Free api.ipify.org / ipapi.co)
async function addLiveLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const locationStr = `📍 ${data.city || 'शहर'}, ${data.region || 'राज्य'}`;
        const text = new fabric.Textbox(locationStr, {
            left: 20, top: canvas.height - 40, fontSize: canvas.width * 0.04, fill: '#ff4444', fontFamily: 'Mukta', fontWeight: 'bold'
        });
        canvas.add(text);
    } catch(e) { alert("लोकेशन नहीं मिल सकी।"); }
}

// 5. OpenWeatherMap API
async function addLiveWeather() {
    if(OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') return alert("कृपया API Key डालें।");
    try {
        // Default Delhi location for demo, you can link it with Geolocation above
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Delhi&units=metric&appid=${OPENWEATHER_API_KEY}`);
        const data = await res.json();
        const weatherStr = `🌤️ ${data.main.temp}°C | ${data.weather[0].description}`;
        const text = new fabric.Textbox(weatherStr, {
            left: canvas.width - 150, top: 20, fontSize: canvas.width * 0.04, fill: '#facc15', fontWeight: 'bold'
        });
        canvas.add(text);
    } catch(e) { console.error(e); }
}

// 6. World Time API (Free)
async function addLiveTime() {
    try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
        const data = await res.json();
        const date = new Date(data.datetime);
        const timeStr = `🕒 ${date.toLocaleDateString('hi-IN')} | ${date.toLocaleTimeString('hi-IN', {hour:'2-digit', minute:'2-digit'})}`;
        const text = new fabric.Textbox(timeStr, {
            left: 20, top: 20, fontSize: canvas.width * 0.04, fill: '#ffffff', fontWeight: 'bold'
        });
        canvas.add(text);
    } catch(e) { console.error(e); }
}

// 7. QR Code Generator API (Free)
function addQRCode() {
    const url = prompt("वेबसाइट या न्यूज़ का लिंक डालें:");
    if(!url) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
    
    fabric.Image.fromURL(qrUrl, (img) => {
        img.set({ left: canvas.width - 100, top: canvas.height - 100, originX: 'center', originY: 'center' });
        canvas.add(img);
    });
}

// 8. NewsData.io API (News Suggestions)
async function fetchBreakingNewsData() {
    if(NEWSDATA_API_KEY === 'YOUR_NEWSDATA_API_KEY') return alert("NewsData API Key डालें।");
    try {
        const res = await fetch(`https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&country=in&language=hi`);
        const data = await res.json();
        const headline = data.results[0]?.title || "आज की ताज़ा खबर";
        addTextLayer(headline);
    } catch(e) { console.error(e); }
}

// 9. Web Share API & HD Export
document.getElementById('exportBtn').addEventListener('click', () => {
    canvas.discardActiveObject(); canvas.renderAll();
    const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 1, multiplier: 2 });
    const link = document.createElement('a');
    link.download = `News_Pro_${Date.now()}.jpg`;
    link.href = dataURL;
    link.click();
});

document.getElementById('shareBtn').addEventListener('click', async () => {
    canvas.discardActiveObject(); canvas.renderAll();
    const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9 });
    const blob = await (await fetch(dataURL)).blob();
    const file = new File([blob], 'news.jpg', { type: 'image/jpeg' });
    
    if (navigator.share) {
        navigator.share({ title: 'Breaking News', text: 'यहाँ पढ़ें पूरी खबर:', files: [file] })
        .catch(console.error);
    } else {
        alert("आपका डिवाइस Web Share API सपोर्ट नहीं करता। HD बटन से डाउनलोड करें।");
    }
});

// ==========================================
// 7. TEMPLATE SYSTEM (Layout Builder)
// ==========================================
function loadBreakingNewsTemplate() {
    canvas.clear();
    canvas.setBackgroundColor('#1f2937', canvas.renderAll.bind(canvas));
    
    // Bottom Red Band for Headline
    const band = new fabric.Rect({
        left: 0, top: canvas.height - (canvas.height * 0.25), width: canvas.width, height: canvas.height * 0.25,
        fill: '#cc0000', selectable: false
    });
    
    // "BREAKING NEWS" Badge
    const badgeBg = new fabric.Rect({
        left: canvas.width / 2, top: 40, originX: 'center', originY: 'center',
        width: 250, height: 50, fill: '#ffcc00', rx: 10, ry: 10
    });
    const badgeText = new fabric.Textbox("बड़ी खबर", {
        left: canvas.width / 2, top: 40, originX: 'center', originY: 'center',
        fontSize: 30, fill: '#000000', fontWeight: 'bold', fontFamily: 'Mukta'
    });
    const badgeGroup = new fabric.Group([badgeBg, badgeText], { selectable: true });

    // Main Headline Text
    const headline = new fabric.Textbox("यहाँ अपनी मुख्य ब्रेकिंग न्यूज़ की हेडलाइन लिखें", {
        left: canvas.width / 2, top: canvas.height - (canvas.height * 0.15), originX: 'center', originY: 'center',
        fontSize: canvas.width * 0.07, fill: '#ffffff', fontWeight: 'bold', fontFamily: 'Mukta',
        textAlign: 'center', width: canvas.width * 0.9,
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 4, offsetX: 2, offsetY: 2 })
    });

    canvas.add(band, badgeGroup, headline);
    canvas.renderAll();
    saveState();
}
