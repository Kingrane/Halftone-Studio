// Video processing module
(function() {

    var videoMediaRecorder = null;
    var videoChunks = [];
    var isProcessingVideo = false;
    var videoElement = null;
    var animationFrameId = null;

    var MAX_FILE_SIZE = 30 * 1024 * 1024;

    function initVideoUpload() {
        var videoFileInput = document.getElementById('videoFile');
        var videoExportBtn = document.getElementById('exportVideoBtn');

        if (!videoFileInput) return;
        if (!videoExportBtn) return;

        videoFileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            if (file.size > MAX_FILE_SIZE) {
                alert(currentLang === 'ru' ? 'Файл слишком большой. Максимальный размер: 30 МБ' : 'File too large. Maximum size: 30 MB');
                return;
            }

            if (!file.type.startsWith('video/')) {
                alert(currentLang === 'ru' ? 'Пожалуйста, выберите видео файл' : 'Please select a video file');
                return;
            }

            loadVideo(file);
        });

        videoExportBtn.addEventListener('click', function() {
            if (currentVideo) {
                exportVideo();
            }
        });
    }

    function loadVideo(file) {
        if (videoElement) {
            videoElement.pause();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (videoElement.src) {
                URL.revokeObjectURL(videoElement.src);
            }
        }

        videoElement = document.createElement('video');
        videoElement.preload = 'auto';
        videoElement.muted = true;
        videoElement.loop = false;
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);

        var url = URL.createObjectURL(file);
        videoElement.src = url;

        videoElement.onloadedmetadata = function () {
            currentVideo = videoElement;
            isVideoLoaded = true;
            if (HalftoneApp && HalftoneApp.updateButtonsForVideo) {
                HalftoneApp.updateButtonsForVideo();
            }

            var t = translations[currentLang];
            var statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.textContent = t.statusReady(videoElement.videoWidth, videoElement.videoHeight);
            }

            videoElement.currentTime = 0;
            videoElement.play();
            renderVideoFrame();

            var exportBtn = document.getElementById('exportVideoBtn');
            if (exportBtn) {
                exportBtn.classList.remove('hidden');
                exportBtn.disabled = false;
            }
        };

        videoElement.onerror = function () {
            alert(currentLang === 'ru' ? 'Ошибка загрузки видео' : 'Video loading error');
        };

        videoElement.onended = function () {
            if (!isProcessingVideo && videoElement) {
                videoElement.currentTime = 0;
                videoElement.play();
                renderVideoFrame();
            }
        };
    }

    function renderVideoFrame() {
        if (!videoElement || !isVideoLoaded || isProcessingVideo) return;

        if (HalftoneApp && HalftoneApp.renderVideoToCanvas) {
            HalftoneApp.renderVideoToCanvas(videoElement);
        }

        animationFrameId = requestAnimationFrame(renderVideoFrame);
    }

    function exportVideo() {
        if (!currentVideo) return;

        var videoProgress = document.getElementById('videoProgress');
        var videoExportBtn = document.getElementById('exportVideoBtn');
        var videoUpload = document.getElementById('upload');

        if (!videoProgress || !videoExportBtn) return;

        if (videoElement) {
            videoElement.pause();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        isProcessingVideo = true;
        videoProgress.classList.remove('hidden');
        videoExportBtn.disabled = true;
        if (videoUpload) videoUpload.disabled = true;

        var fps = 30;
        var duration = currentVideo.duration;

        var canvasStream = canvas.captureStream(fps);
        var mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        videoMediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: mimeType,
            videoBitsPerSecond: 5000000
        });

        videoChunks = [];

        videoMediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) {
                videoChunks.push(e.data);
            }
        };

        videoMediaRecorder.onstop = function () {
            var blob = new Blob(videoChunks, { type: mimeType });
            var url = URL.createObjectURL(blob);
            downloadVideo(url);
            videoProgress.classList.add('hidden');
            videoExportBtn.disabled = false;
            if (videoUpload) videoUpload.disabled = false;
            isProcessingVideo = false;

            if (videoElement) {
                videoElement.currentTime = 0;
                videoElement.play();
                renderVideoFrame();
            }
        };

        videoMediaRecorder.start();

        var frameInterval = 1000 / fps;
        var currentTime = 0;
        var frameCount = Math.floor(duration * fps);

        function processNextFrame() {
            if (!isProcessingVideo) return;

            var progress = Math.round((currentTime / duration) * 100);

            var videoProgressBar = document.getElementById('videoProgressBar');
            var videoProgressText = document.getElementById('videoProgressText');

            if (videoProgressBar) videoProgressBar.style.width = progress + '%';
            if (videoProgressText) videoProgressText.textContent = progress + '%';

            if (HalftoneApp && HalftoneApp.renderVideoToCanvas) {
                HalftoneApp.renderVideoToCanvas(currentVideo);
            }

            currentTime += frameInterval / 1000;

            if (currentTime < duration) {
                currentVideo.currentTime = currentTime;
                setTimeout(processNextFrame, frameInterval);
            } else {
                setTimeout(function() {
                    if (videoMediaRecorder && videoMediaRecorder.state === 'recording') {
                        videoMediaRecorder.stop();
                    }
                }, frameInterval);
            }
        }

        currentVideo.currentTime = 0;
        setTimeout(processNextFrame, frameInterval);
    }

    function downloadVideo(url) {
        var link = document.createElement('a');
        link.download = 'halftone-video.webm';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(initVideoUpload, 100);
        });
    } else {
        setTimeout(initVideoUpload, 100);
    }
})();
