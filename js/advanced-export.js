let exportSettings = {
    format: 'webm',
    quality: 0.8,
    fps: 30,
    resolution: 'original',
    transparent: true,
    loop: false
};
let exportProgress = 0;
let isExporting = false;
let exportStream = null;
let exportRecorder = null;
let exportChunks = [];
let exportAnimationFrame = null;
let exportStartTime = null;
let originalShowHandles = true;
function hideHandlesForExport() {
    if (typeof window.showHandles !== 'undefined') {
        originalShowHandles = window.showHandles;
        window.showHandles = false;
    } else if (typeof showHandles !== 'undefined') {
        originalShowHandles = showHandles;
        showHandles = false;
    }
    if (typeof drawAll === 'function') drawAll();
}
function restoreHandlesAfterExport() {
    if (typeof window.showHandles !== 'undefined') {
        window.showHandles = originalShowHandles;
    } else if (typeof showHandles !== 'undefined') {
        showHandles = originalShowHandles;
    }
    if (typeof drawAll === 'function') drawAll();
}
function cancelExport() {
    isExporting = false;
    if (exportRecorder && exportRecorder.state === 'recording') {
        exportRecorder.stop();
    }
    if (exportAnimationFrame) {
        cancelAnimationFrame(exportAnimationFrame);
    }
    updateExportProgress(0, 'Export cancelled');
    showToast("Export cancelled", 'I');
    restoreHandlesAfterExport();
}
function initExportModal() {
    const btnExportAdvanced = document.getElementById('btnExportAdvanced');
    const exportModal = document.getElementById('exportModal');
    const closeExportBtn = document.getElementById('closeExportBtn');
    const btnStartExport = document.getElementById('btnStartExport');
    const btnCancelExport = document.getElementById('btnCancelExport');
    if (btnExportAdvanced) {
        btnExportAdvanced.addEventListener('click', () => {
            openPopup(exportModal);
        });
    }
    if (closeExportBtn) {
        closeExportBtn.addEventListener('click', () => {
            exportModal.classList.remove('open');
        });
    }
    if (btnCancelExport) {
        btnCancelExport.addEventListener('click', () => {
            if (isExporting) {
                cancelExport();
            }
            exportModal.classList.remove('open');
        });
    }
    if (btnStartExport) {
        btnStartExport.addEventListener('click', startAdvancedExport);
    }
    const exportQualityContainer = document.getElementById('exportQualitySlider');
    if (exportQualityContainer) {
        const qualitySlider = createRNSlider({
            label: 'Quality',
            value: 80,
            min: 10,
            max: 100,
            step: 5,
            orientation: 'horizontal',
            width: 260,
            height: 50,
            onChange: (v) => {
                exportSettings.quality = v / 100;
            }
        });
        exportQualityContainer.appendChild(qualitySlider);
    }
    const exportFormat = document.getElementById('exportFormat');
    if (exportFormat) {
        exportFormat.addEventListener('change', (e) => {
            exportSettings.format = e.target.value;
        });
    }
    const exportFPS = document.getElementById('exportFPS');
    if (exportFPS) {
        exportFPS.addEventListener('change', (e) => {
            exportSettings.fps = parseInt(e.target.value);
        });
    }
    const exportResolution = document.getElementById('exportResolution');
    if (exportResolution) {
        exportResolution.addEventListener('change', (e) => {
            exportSettings.resolution = e.target.value;
        });
    }
    const exportTransparent = document.getElementById('exportTransparent');
    if (exportTransparent) {
        exportTransparent.addEventListener('change', (e) => {
            exportSettings.transparent = e.target.checked;
        });
    }
    const exportLoop = document.getElementById('exportLoop');
    if (exportLoop) {
        exportLoop.addEventListener('change', (e) => {
            exportSettings.loop = e.target.checked;
        });
    }
}
function getExportCanvas() {
    const originalCanvas = canvas;
    let width = originalCanvas.width;
    let height = originalCanvas.height;
    switch(exportSettings.resolution) {
        case '720p':
            const scale720 = 720 / height;
            width = originalCanvas.width * scale720;
            height = 720;
            break;
        case '1080p':
            const scale1080 = 1080 / height;
            width = originalCanvas.width * scale1080;
            height = 1080;
            break;
        case '4k':
            const scale4k = 2160 / height;
            width = originalCanvas.width * scale4k;
            height = 2160;
            break;
    }
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    return exportCanvas;
}
function updateExportProgress(progress, message) {
    exportProgress = progress;
    const progressBar = document.getElementById('exportProgressBar');
    const progressText = document.getElementById('exportProgressText');
    const progressContainer = document.getElementById('exportProgressContainer');
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = message || `${Math.round(progress)}%`;
}
function cancelExport() {
    isExporting = false;
    if (exportRecorder && exportRecorder.state === 'recording') {
        exportRecorder.stop();
    }
    if (exportAnimationFrame) {
        cancelAnimationFrame(exportAnimationFrame);
    }
    updateExportProgress(0, 'Export cancelled');
    showToast("Export cancelled", 'I');
}
async function renderFrame(exportCanvas, time) {
    return new Promise((resolve) => {
        window.seekAnimation(time);
        setTimeout(() => {
            const ctx = exportCanvas.getContext('2d');
            const scaleX = exportCanvas.width / canvas.width;
            const scaleY = exportCanvas.height / canvas.height;
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            if (!exportSettings.transparent) {
                ctx.fillStyle = window.animationState.settings.bgColor;
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            }
            ctx.save();
            ctx.scale(scaleX, scaleY);
            const currentSelectedShapes = [];
            for (let shape of shapes) {
                if (shape.selected) {
                    currentSelectedShapes.push(shape);
                    shape.selected = false;
                }
            }
            for (let shape of shapes) {
                shape.draw(ctx);
            }
            for (let shape of currentSelectedShapes) {
                shape.selected = true;
            }
            ctx.restore();
            resolve();
        }, 16);
    });
}
async function exportAsPNGSequence() {
    const duration = window.animationState.duration;
    const fps = exportSettings.fps;
    const totalFrames = Math.ceil(duration * fps);
    const exportCanvas = getExportCanvas();
    const zip = new JSZip();
    hideHandlesForExport();
    const originalTime = window.animationState.currentTime;
    const wasPlaying = window.animationState.isPlaying;
    window.animationState.isPlaying = false;
    updateExportProgress(0, "Rendering PNG frames...");
    let renderedFrames = 0;
    for (let frame = 0; frame <= totalFrames; frame++) {
        if (!isExporting) {
            restoreHandlesAfterExport();
            break;
        }
        const time = frame / fps;
        await renderFrame(exportCanvas, Math.min(time, duration));
        renderedFrames++;
        const renderProgress = (renderedFrames / (totalFrames + 1)) * 60;
        updateExportProgress(renderProgress, `Rendering frame ${renderedFrames}/${totalFrames + 1}`);
        const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, 'image/png'));
        zip.file(`frame_${String(frame).padStart(6, '0')}.png`, blob);
    }
    window.seekAnimation(originalTime);
    window.animationState.isPlaying = wasPlaying;
    if (isExporting) {
        updateExportProgress(65, "Creating ZIP archive...");
        const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
            const zipProgress = 65 + (metadata.percent * 0.35);
            updateExportProgress(zipProgress, `Creating ZIP: ${Math.round(metadata.percent)}%`);
        });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.animationState.settings.projectName}_sequence.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        updateExportProgress(100, "Export complete!");
        showToast("PNG Sequence exported!", 'S');
        isExporting = false;
        restoreHandlesAfterExport();
    } else {
        restoreHandlesAfterExport();
    }
}
async function exportAsGIF() {
    const duration = window.animationState.duration;
    const fps = exportSettings.fps;
    const totalFrames = Math.ceil(duration * fps);
    const exportCanvas = getExportCanvas();
    hideHandlesForExport();
    const gif = new GIF({
        workers: 2,
        quality: Math.floor(exportSettings.quality * 10),
        width: exportCanvas.width,
        height: exportCanvas.height,
        workerScript: './js/lib/gif.worker.js'
    });
    const originalTime = window.animationState.currentTime;
    const wasPlaying = window.animationState.isPlaying;
    window.animationState.isPlaying = false;
    updateExportProgress(0, "Rendering GIF frames...");
    let renderedFrames = 0;
    for (let frame = 0; frame < totalFrames; frame++) {
        if (!isExporting) {
            restoreHandlesAfterExport();
            break;
        }
        const time = frame / fps;
        await renderFrame(exportCanvas, time);
        const ctx = exportCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
        gif.addFrame(imageData, { delay: Math.floor(1000 / fps) });
        renderedFrames++;
        const renderProgress = (renderedFrames / totalFrames) * 70;
        updateExportProgress(renderProgress, `Rendering frame ${renderedFrames}/${totalFrames}`);
    }
    window.seekAnimation(originalTime);
    window.animationState.isPlaying = wasPlaying;
    if (isExporting) {
        updateExportProgress(70, "Encoding GIF...");
        gif.on('progress', (progress) => {
            const encodeProgress = 70 + (progress * 0.28);
            updateExportProgress(encodeProgress, `Encoding GIF: ${Math.round(progress * 100)}%`);
        });
        gif.on('finished', (blob) => {
            updateExportProgress(99, "Finalizing download...");
            setTimeout(() => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${window.animationState.settings.projectName}.gif`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                updateExportProgress(100, "Export complete!");
                showToast("GIF exported!", 'S');
                isExporting = false;
                restoreHandlesAfterExport();
            }, 100);
        });
        gif.render();
    } else {
        restoreHandlesAfterExport();
    }
}
async function exportAsVideo() {
    const duration = window.animationState.duration;
    const fps = exportSettings.fps;
    const totalFrames = Math.ceil(duration * fps);
    const exportCanvas = getExportCanvas();
    hideHandlesForExport();
    const originalTime = window.animationState.currentTime;
    const wasPlaying = window.animationState.isPlaying;
    window.animationState.isPlaying = false;
    updateExportProgress(0, "Rendering video frames...");
    const frames = [];
    let renderedFrames = 0;
    for (let frame = 0; frame < totalFrames; frame++) {
        if (!isExporting) {
            restoreHandlesAfterExport();
            window.seekAnimation(originalTime);
            window.animationState.isPlaying = wasPlaying;
            return;
        }
        const time = frame / fps;
        await renderFrame(exportCanvas, time);
        const ctx = exportCanvas.getContext('2d');
        frames.push(ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height));
        renderedFrames++;
        const renderProgress = (renderedFrames / totalFrames) * 60;
        updateExportProgress(renderProgress, `Rendering frame ${renderedFrames}/${totalFrames}`);
    }
    updateExportProgress(65, "Creating video...");
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = exportCanvas.width;
    videoCanvas.height = exportCanvas.height;
    const videoCtx = videoCanvas.getContext('2d');
    const stream = videoCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: Math.floor(exportSettings.quality * 8000000)
    });
    const chunks = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    const videoPromise = new Promise((resolve) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };
    });
    recorder.start();
    let writtenFrames = 0;
    for (let i = 0; i < frames.length; i++) {
        if (!isExporting) {
            recorder.stop();
            restoreHandlesAfterExport();
            window.seekAnimation(originalTime);
            window.animationState.isPlaying = wasPlaying;
            return;
        }
        videoCtx.putImageData(frames[i], 0, 0);
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
        writtenFrames++;
        const writeProgress = 65 + (writtenFrames / frames.length) * 30;
        updateExportProgress(writeProgress, `Writing frame ${writtenFrames}/${frames.length}`);
    }
    updateExportProgress(98, "Finalizing video...");
    setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
    }, 100);
    const blob = await videoPromise;
    updateExportProgress(99, "Preparing download...");
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${window.animationState.settings.projectName}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.seekAnimation(originalTime);
    window.animationState.isPlaying = wasPlaying;
    drawAll();
    updateExportProgress(100, "Export complete!");
    showToast("Video exported successfully!", 'S');
    isExporting = false;
    restoreHandlesAfterExport();
}
function exportAsJSON() {
    updateExportProgress(0, "Preparing JSON data...");
    const cleanShapes = shapes.map(s => {
        const copy = { ...s };
        delete copy.imageObj;
        delete copy.fillImageObj;
        delete copy.parentGroup;
        return copy;
    });
    updateExportProgress(50, "Creating JSON file...");
    const data = {
        version: "2.0",
        settings: window.animationState.settings,
        shapes: cleanShapes,
        exportDate: new Date().toISOString()
    };
    updateExportProgress(80, "Generating download...");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${window.animationState.settings.projectName}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    updateExportProgress(100, "Export complete!");
    showToast("Project exported!", 'S');
    isExporting = false;
}
async function startAdvancedExport() {
    if (window.animationState.duration === 0) {
        showToast("Add keyframes first!", 'E');
        return;
    }
    isExporting = true;
    updateExportProgress(0, "Starting export...");
    try {
        switch(exportSettings.format) {
            case 'webm':
            case 'mp4':
                await exportAsVideo();
                break;
            case 'gif':
                await exportAsGIF();
                break;
            case 'png':
                await exportAsPNGSequence();
                break;
            case 'json':
                exportAsJSON();
                break;
        }
    } catch (error) {
        console.error("Export error:", error);
        showToast("Export failed: " + error.message, 'E');
        isExporting = false;
    }
}
initExportModal();
