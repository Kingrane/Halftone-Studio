const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const upload = document.getElementById('upload');
const resInput = document.getElementById('resolution');
const radiusInput = document.getElementById('radiusMultiplier');
const contrastInput = document.getElementById('contrast');
const animateToggle = document.getElementById('animateToggle');
const downloadBtn = document.getElementById('downloadBtn');
const exportGifBtn = document.getElementById('exportGifBtn');
const resetBtn = document.getElementById('resetBtn');

let originalImage = null;
let currentVideo = null;
let gifWorkerBlob = null;
let currentLang = localStorage.getItem('lang') || 'ru';
let currentMode = 'classic';
let animFrame = 0;
let isAnimating = false;
let isVideoLoaded = false;

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

var HalftoneApp = {
    updateButtonsForImage: function () {
        if (downloadBtn) downloadBtn.disabled = false;
        if (exportGifBtn) exportGifBtn.disabled = !animateToggle.checked;
    },
    updateButtonsForVideo: function () {
        if (downloadBtn) downloadBtn.disabled = true;
        if (exportGifBtn) exportGifBtn.disabled = true;
    },
    renderVideoToCanvas: function (video) {
        var res = parseInt(resInput.value);
        var contrast = parseFloat(contrastInput.value);
        var rMultBase = parseFloat(radiusInput.value);
        var rMult = rMultBase;

        var maxDim = 1920;
        var width = Math.min(video.videoWidth, maxDim);
        var height = width * (video.videoHeight / video.videoWidth);

        canvas.width = width;
        canvas.height = height;

        var tempCanvas = document.createElement('canvas');
        var tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCtx.filter = 'contrast(' + contrast + ')';
        tempCtx.drawImage(video, 0, 0, width, height);

        var imageData = tempCtx.getImageData(0, 0, width, height).data;

        ctx.fillStyle = (currentMode === 'classic') ? '#ffffff' : '#000000';
        ctx.fillRect(0, 0, width, height);

        var asciiChars = ' @%#*+=-:. ';
        var asciiLen = asciiChars.length;

        for (var y = 0; y < height; y += res) {
            for (var x = 0; x < width; x += res) {
                var idx = (Math.floor(y) * width + Math.floor(x)) * 4;
                var r = imageData[idx];
                var g = imageData[idx + 1];
                var b = imageData[idx + 2];
                var brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

                ctx.beginPath();

                if (currentMode === 'classic') {
                    ctx.fillStyle = '#000000';
                    var radius = (res / 2) * (1 - brightness) * rMult;
                    ctx.arc(x + res / 2, y + res / 2, Math.max(0, radius), 0, Math.PI * 2);
                    ctx.fill();
                }
                else if (currentMode === 'rgb') {
                    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                    radius = (res / 2.2) * brightness * rMult;
                    ctx.arc(x + res / 2, y + res / 2, Math.max(0, radius), 0, Math.PI * 2);
                    ctx.fill();
                }
                else if (currentMode === 'led') {
                    radius = (res / 2.5) * brightness * rMult;
                    if (radius > 0.5) {
                        ctx.shadowBlur = res * 0.8;
                        ctx.shadowColor = 'rgb(' + r + ',' + g + ',' + b + ')';
                        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                        ctx.arc(x + res / 2, y + res / 2, radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
                else if (currentMode === 'squares') {
                    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                    var size = res * brightness * rMult;
                    ctx.fillRect(x + (res - size) / 2, y + (res - size) / 2, size, size);
                }
                else if (currentMode === 'ascii') {
                    var charIdx = Math.floor((1 - brightness) * (asciiLen - 1));
                    var char = asciiChars[Math.min(charIdx, asciiLen - 1)];
                    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
                    ctx.font = Math.floor(res * 0.85 * rMult) + 'px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(char, x + res / 2, y + res / 2);
                }
                else if (currentMode === 'duotone') {
                    var duotoneColor1 = document.getElementById('duotoneColor1').value;
                    var duotoneColor2 = document.getElementById('duotoneColor2').value;
                    var color1 = hexToRgb(duotoneColor1);
                    var color2 = hexToRgb(duotoneColor2);
                    var dr = color2.r - color1.r;
                    var dg = color2.g - color1.g;
                    var db = color2.b - color1.b;
                    var duotoneR = Math.round(color1.r + dr * brightness);
                    var duotoneG = Math.round(color1.g + dg * brightness);
                    var duotoneB = Math.round(color1.b + db * brightness);
                    ctx.fillStyle = 'rgb(' + duotoneR + ',' + duotoneG + ',' + duotoneB + ')';
                    var size = res * brightness * rMult;
                    ctx.fillRect(x + (res - size) / 2, y + (res - size) / 2, size, size);
                }
            }
        }
    }
};

const translations = {
    ru: {
        title: 'Halftone Studio',
        subtitle: 'Добавье эффектов вашему изображению',
        upload: 'Загрузить',
        modesTitle: 'Визуальный стиль',
        paramsTitle: 'Параметры',
        density: 'Плотность сетки',
        radius: 'Размер частиц',
        contrast: 'Контрастность',
        animation: 'Анимация',
        animationDesc: 'Пульсация точек',
        download: 'Сохранить PNG',
        exportGif: 'Экспорт в GIF (Loop)',
        reset: 'Сбросить все',
        statusWait: 'Ожидание изображения...',
        statusReady: (w, h) => `Готово: ${w}x${h}`,
        gifGenerating: 'Генерация GIF...',
        dropZone: 'Отпустите файл здесь',
        gpu: 'GPU Accelerated',
        aboutBtn: 'О сервисе',
        aboutTitle: 'О сервисе',
        aboutDescTitle: 'Что это?',
        aboutDesc: 'Halftone Studio - бесплатный инструмент для создания креативных эффектов на основе анализа яркости изображения. Применяйте стили halftone, RGB-точки, LED-эффект, ASCII-арт и многое другое.',
        aboutHowTitle: 'Как использовать',
        aboutHow1: 'Загрузите изображение или видео',
        aboutHow2: 'Выберите визуальный стиль',
        aboutHow3: 'Настройте параметры сетки и эффектов',
        aboutHow4: 'Сохраните результат в PNG, GIF или видео',
        aboutDonateTitle: 'Поддержать автора',
        aboutDonateDesc: 'Если инструмент оказался полезным, вы можете поддержать его развитие:',
        videoBtn: 'Видео',
        videoProgress: 'Обработка видео...',
        saveVideo: 'Сохранить видео',
        fileTooLarge: 'Файл слишком большой. Максимальный размер: 30 МБ',
        notAnImage: 'Пожалуйста, выберите изображение',
        duotoneTitle: 'Цвета Duotone',
        duotoneShadows: 'Тени',
        duotoneHighlights: 'Света'
    },
    en: {
        title: 'Halftone Studio',
        subtitle: 'Add effects to your images',
        upload: 'Upload',
        modesTitle: 'Visual Style',
        paramsTitle: 'Parameters',
        density: 'Grid Density',
        radius: 'Particle Size',
        contrast: 'Contrast',
        animation: 'Animation',
        animationDesc: 'Dot Pulsation',
        download: 'Save PNG',
        exportGif: 'Export GIF (Loop)',
        reset: 'Reset All',
        statusWait: 'Waiting for image...',
        statusReady: (w, h) => `Ready: ${w}x${h}`,
        gifGenerating: 'Generating GIF...',
        dropZone: 'Drop file here',
        gpu: 'GPU Accelerated',
        aboutBtn: 'About',
        aboutTitle: 'About',
        aboutDescTitle: 'What is this?',
        aboutDesc: 'Halftone Studio is a free tool for creating creative effects based on brightness analysis. Apply halftone styles, RGB dots, LED effects, ASCII art and more.',
        aboutHowTitle: 'How to use',
        aboutHow1: 'Upload an image or video',
        aboutHow2: 'Choose a visual style',
        aboutHow3: 'Adjust grid and effect parameters',
        aboutHow4: 'Save the result as PNG, GIF or video',
        aboutDonateTitle: 'Support the author',
        aboutDonateDesc: 'If you found this tool useful, you can support its development:',
        videoBtn: 'Video',
        videoProgress: 'Processing video...',
        saveVideo: 'Save video',
        fileTooLarge: 'File too large. Maximum size: 30 MB',
        notAnImage: 'Please select an image',
        duotoneTitle: 'Duotone Colors',
        duotoneShadows: 'Shadows',
        duotoneHighlights: 'Highlights'
    }
};

function updateTexts() {
    const t = translations[currentLang];
    var h1 = document.querySelector('h1');
    var headerP = document.querySelector('header p');
    var uploadBtnText = document.getElementById('uploadBtnText');
    var sectionH2 = document.querySelectorAll('section h2');
    var resValPrev = document.querySelector('#resVal');
    var radiusValPrev = document.querySelector('#radiusVal');
    var contrastValPrev = document.querySelector('#contrastVal');
    var animateToggleParent = document.querySelector('#animateToggle');
    var downloadBtnText = document.getElementById('downloadBtnText');
    var exportGifBtnText = document.getElementById('exportGifBtnText');
    var resetBtnText = document.getElementById('resetBtnText');
    var aboutBtnText = document.getElementById('aboutBtnText');
    var videoBtnText = document.getElementById('videoBtnText');
    var statusText = document.getElementById('statusText');
    var gifProgressLabel = document.getElementById('gifProgressLabel');
    var dropZoneP = document.querySelector('#dropZone p');
    var gpuLabel = document.querySelector('.gpu-label');

    if (h1) h1.innerHTML = t.title + ' <span class="text-sm font-normal opacity-50">:D</span>';
    if (headerP) headerP.textContent = t.subtitle;
    if (uploadBtnText) uploadBtnText.textContent = t.upload;
    if (sectionH2[0]) sectionH2[0].textContent = t.modesTitle;
    if (sectionH2[1]) sectionH2[1].textContent = t.paramsTitle;
    if (resValPrev && resValPrev.previousElementSibling) resValPrev.previousElementSibling.textContent = t.density;
    if (radiusValPrev && radiusValPrev.previousElementSibling) radiusValPrev.previousElementSibling.textContent = t.radius;
    if (contrastValPrev && contrastValPrev.previousElementSibling) contrastValPrev.previousElementSibling.textContent = t.contrast;
    if (animateToggleParent && animateToggleParent.parentElement && animateToggleParent.parentElement.parentElement) {
        animateToggleParent.parentElement.parentElement.querySelector('.text-sm').textContent = t.animation;
        animateToggleParent.parentElement.parentElement.querySelector('.text-xs').textContent = t.animationDesc;
    }
    if (downloadBtnText) downloadBtnText.textContent = t.download;
    if (exportGifBtnText) exportGifBtnText.textContent = t.exportGif;
    if (resetBtnText) resetBtnText.textContent = t.reset;
    if (aboutBtnText) aboutBtnText.textContent = t.aboutBtn;
    if (videoBtnText) videoBtnText.textContent = t.videoBtn;
    if (statusText) statusText.textContent = originalImage ? t.statusReady(originalImage.width, originalImage.height) : t.statusWait;
    if (gifProgressLabel) gifProgressLabel.textContent = t.gifGenerating;
    if (dropZoneP) dropZoneP.textContent = t.dropZone;
    if (gpuLabel) gpuLabel.textContent = t.gpu;

    var aboutElements = ['aboutTitle', 'aboutDescTitle', 'aboutDesc', 'aboutHowTitle', 'aboutHow1', 'aboutHow2', 'aboutHow3', 'aboutHow4', 'aboutDonateTitle', 'aboutDonateDesc'];
    aboutElements.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && t[id]) el.textContent = t[id];
    });

    var duotoneSection = document.getElementById('duotoneColors');
    if (duotoneSection) {
        var duotoneH2 = duotoneSection.querySelector('h2');
        if (duotoneH2 && t.duotoneTitle) duotoneH2.textContent = t.duotoneTitle;
        var color1Label = duotoneSection.querySelectorAll('label')[0];
        if (color1Label && t.duotoneShadows) color1Label.textContent = t.duotoneShadows;
        var color2Label = duotoneSection.querySelectorAll('label')[1];
        if (color2Label && t.duotoneHighlights) color2Label.textContent = t.duotoneHighlights;
    }
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    updateTexts();
}

document.addEventListener('DOMContentLoaded', function () {
    var langRu = document.getElementById('lang-ru');
    var langEn = document.getElementById('lang-en');
    if (langRu) langRu.classList.toggle('active', currentLang === 'ru');
    if (langEn) langEn.classList.toggle('active', currentLang === 'en');
    updateTexts();
});

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('bg-[#49454F]', 'text-white');
        if (btn.id === `btn-${mode}`) btn.classList.add('bg-[#49454F]', 'text-white');
    });

    const duotoneSection = document.getElementById('duotoneColors');
    if (duotoneSection) {
        if (mode === 'duotone') {
            duotoneSection.classList.remove('hidden');
        } else {
            duotoneSection.classList.add('hidden');
        }
    }

    if (originalImage) render();
}

async function createGifWorkerBlob() {
    const workerCode = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
        .then(r => r.text());
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    gifWorkerBlob = URL.createObjectURL(blob);
}
createGifWorkerBlob();

document.addEventListener('DOMContentLoaded', function () {
    exportGifBtn.disabled = !animateToggle.checked;

    upload.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            var t = translations[currentLang];
            alert(t.fileTooLarge || 'Файл слишком большой. Максимальный размер: 30 МБ');
            return;
        }

        if (!file.type.startsWith('image/')) {
            var t = translations[currentLang];
            alert(t.notAnImage || 'Пожалуйста, выберите изображение');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (event) {
            var img = new Image();
            img.onload = function () {
                originalImage = img;
                currentVideo = null;
                isVideoLoaded = false;

                var exportBtn = document.getElementById('exportVideoBtn');
                if (exportBtn) exportBtn.classList.add('hidden');

                if (HalftoneApp && HalftoneApp.updateButtonsForImage) {
                    HalftoneApp.updateButtonsForImage();
                }

                var t = translations[currentLang];
                var statusTextEl = document.getElementById('statusText');
                if (statusTextEl) statusTextEl.textContent = t.statusReady(img.width, img.height);
                render();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

const inputs = [resInput, radiusInput, contrastInput];
const valueLabels = {
    resolution: 'resVal',
    radiusMultiplier: 'radiusVal',
    contrast: 'contrastVal'
};
inputs.forEach(input => {
    input.addEventListener('input', () => {
        const valEl = document.getElementById(valueLabels[input.id]);
        if (valEl) valEl.innerText = input.value;
        if (originalImage) render();
    });
});

const duotoneColor1 = document.getElementById('duotoneColor1');
const duotoneColor2 = document.getElementById('duotoneColor2');
let duotoneTimeout = null;
if (duotoneColor1) {
    duotoneColor1.addEventListener('input', () => {
        if (duotoneTimeout) clearTimeout(duotoneTimeout);
        duotoneTimeout = setTimeout(() => {
            if (originalImage || isVideoLoaded) render();
        }, 50);
    });
}
if (duotoneColor2) {
    duotoneColor2.addEventListener('input', () => {
        if (duotoneTimeout) clearTimeout(duotoneTimeout);
        duotoneTimeout = setTimeout(() => {
            if (originalImage || isVideoLoaded) render();
        }, 50);
    });
}

animateToggle.addEventListener('change', (e) => {
    isAnimating = e.target.checked;
    exportGifBtn.disabled = !isAnimating;
    if (isAnimating) animate();
});

function animate() {
    if (!isAnimating) return;
    animFrame += 0.05;
    render(animFrame);
    requestAnimationFrame(animate);
}

function render(time = 0) {
    if (!originalImage) return;

    const res = parseInt(resInput.value);
    const contrast = parseFloat(contrastInput.value);
    const rMultBase = parseFloat(radiusInput.value);

    const rMult = isAnimating ? rMultBase * (0.8 + Math.sin(time) * 0.2) : rMultBase;

    let width = originalImage.width;
    let height = originalImage.height;
    const maxDim = 1920;
    if (width > maxDim || height > maxDim) {
        const ratio = width / height;
        if (ratio > 1) { width = maxDim; height = maxDim / ratio; }
        else { height = maxDim; width = maxDim * ratio; }
    }

    canvas.width = width;
    canvas.height = height;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.filter = `contrast(${contrast})`;
    tempCtx.drawImage(originalImage, 0, 0, width, height);

    const imageData = tempCtx.getImageData(0, 0, width, height).data;

    ctx.fillStyle = (currentMode === 'classic') ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, width, height);

    const asciiChars = ' @%#*+=-:. ';
    const asciiLen = asciiChars.length;

    for (let y = 0; y < height; y += res) {
        for (let x = 0; x < width; x += res) {
            const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            ctx.beginPath();

            if (currentMode === 'classic') {
                ctx.fillStyle = '#000000';
                const radius = (res / 2) * (1 - brightness) * rMult;
                ctx.arc(x + res / 2, y + res / 2, Math.max(0, radius), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (currentMode === 'rgb') {
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                const radius = (res / 2.2) * brightness * rMult;
                ctx.arc(x + res / 2, y + res / 2, Math.max(0, radius), 0, Math.PI * 2);
                ctx.fill();
            }
            else if (currentMode === 'led') {
                const radius = (res / 2.5) * brightness * rMult;
                if (radius > 0.5) {
                    ctx.shadowBlur = res * 0.8;
                    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.arc(x + res / 2, y + res / 2, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
            else if (currentMode === 'squares') {
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                const size = res * brightness * rMult;
                ctx.fillRect(x + (res - size) / 2, y + (res - size) / 2, size, size);
            }
            else if (currentMode === 'ascii') {
                const animBrightness = isAnimating ? brightness * (0.7 + Math.sin(time + x * 0.01 + y * 0.01) * 0.3) : brightness;
                const charIdx = Math.floor((1 - animBrightness) * (asciiLen - 1));
                const char = asciiChars[Math.min(charIdx, asciiLen - 1)];
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.font = `${Math.floor(res * 0.85 * rMult)}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(char, x + res / 2, y + res / 2);
            }
            else if (currentMode === 'duotone') {
                const duotoneColor1 = document.getElementById('duotoneColor1').value;
                const duotoneColor2 = document.getElementById('duotoneColor2').value;
                const color1 = hexToRgb(duotoneColor1);
                const color2 = hexToRgb(duotoneColor2);
                const dr = color2.r - color1.r;
                const dg = color2.g - color1.g;
                const db = color2.b - color1.b;
                const duotoneR = Math.round(color1.r + dr * brightness);
                const duotoneG = Math.round(color1.g + dg * brightness);
                const duotoneB = Math.round(color1.b + db * brightness);
                ctx.fillStyle = `rgb(${duotoneR}, ${duotoneG}, ${duotoneB})`;
                const size = res * brightness * rMult;
                ctx.fillRect(x + (res - size) / 2, y + (res - size) / 2, size, size);
            }
        }
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

exportGifBtn.addEventListener('click', () => {
    if (!originalImage) return;

    const gifProgress = document.getElementById('gifProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    gifProgress.classList.remove('hidden');
    exportGifBtn.disabled = true;

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: gifWorkerBlob
    });

    const totalFrames = 20;
    for (let i = 0; i < totalFrames; i++) {
        const time = (i / totalFrames) * Math.PI * 2;
        render(time);
        gif.addFrame(ctx, { copy: true, delay: 50 });
    }

    gif.on('progress', (p) => {
        const pct = Math.round(p * 100);
        progressBar.style.width = pct + '%';
        progressText.innerText = pct + '%';
    });

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'halftone-animation.gif';
        link.href = url;
        link.click();

        gifProgress.classList.add('hidden');
        exportGifBtn.disabled = false;
        if (isAnimating) animate(); else render();
    });

    gif.render();
});

downloadBtn.addEventListener('click', () => {
    if (!originalImage) return;
    const link = document.createElement('a');
    link.download = 'halftone-pro.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

resetBtn.addEventListener('click', () => {
    isAnimating = false;
    animateToggle.checked = false;

    resInput.value = 12;
    radiusInput.value = 1.0;
    contrastInput.value = 1.2;

    document.getElementById('resVal').innerText = '12';
    document.getElementById('radiusVal').innerText = '1.0';
    document.getElementById('contrastVal').innerText = '1.2';

    if (originalImage) {
        render();
    }
});

function openAboutModal() {
    document.getElementById('aboutModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
    document.getElementById('aboutModal').classList.add('hidden');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAboutModal();
    }
});
