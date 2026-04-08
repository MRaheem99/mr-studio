    btnModeObject.addEventListener('click', () => setMode('object'));
    btnModeCanvas.addEventListener('click', () => setMode('canvas'));

    function drawTimelineRuler() {
        const ctx = timelineRuler.getContext("2d");
        const width = timelineTracks.scrollWidth || 2000;
        timelineRuler.width = width;
        timelineRuler.height = 39;
        ctx.clearRect(0, 0, width, 39);
        const duration = Math.max(20, window.animationState.duration) || 20;
        const bottom = timelineRuler.height;
        for(let s = 0; s <= duration; s++) {
            const x = s * pixelsPerSecond;
            ctx.strokeStyle = "#666";
            ctx.beginPath();
            ctx.moveTo(x, bottom);
            ctx.lineTo(x, bottom - 20);
            ctx.stroke();
            ctx.fillStyle = "#aaa";
            ctx.font = "10px sans-serif";
            ctx.fillText(s + "s", x + 4, bottom - 22);
            for(let sub = 1; sub < subdivisions; sub++) {
                const subX = x + (sub * pixelsPerSecond / subdivisions);
                ctx.strokeStyle = "#333";
                ctx.beginPath();
                ctx.moveTo(subX, bottom);
                ctx.lineTo(subX, bottom - 10);
                ctx.stroke();
            }
        }
    }

    function setMode(mode) {
        viewport.mode = mode;
        if(mode === 'canvas') {
            container.classList.add('canvas-mode');
            btnModeCanvas.classList.add('mode-active');
            btnModeObject.classList.remove('mode-active');
        } else {
            container.classList.remove('canvas-mode');
            btnModeObject.classList.add('mode-active');
            btnModeCanvas.classList.remove('mode-active');
        }
    }

    function fitCanvasToScreen() {
        const s = window.animationState.settings;
        const containerRect = container.getBoundingClientRect();
        const scaleX = containerRect.width / s.width;
        const scaleY = containerRect.height / s.height;
        const fitScale = Math.min(scaleX, scaleY) * 0.95;
        viewport.scale = fitScale;
        const canvasWidth = s.width * fitScale;
        const canvasHeight = s.height * fitScale;
        viewport.pointX = (containerRect.width - canvasWidth) / 2;
        viewport.pointY = (containerRect.height - canvasHeight) / 2;
        updateCanvasTransform();
    }

    function updateCanvasTransform() {
        canvas.style.transform = `translate(${viewport.pointX}px, ${viewport.pointY}px) scale(${viewport.scale})`;
        canvas.style.transformOrigin = "top left";
        if(drawingCanvas) {
            drawingCanvas.style.transform = canvas.style.transform;
            drawingCanvas.style.transformOrigin = canvas.style.transformOrigin;
        }
    }

    function initCanvas() {
        const s = window.animationState.settings;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = s.width * dpr;
        canvas.height = s.height * dpr;
        canvas.style.width = s.width + "px";
        canvas.style.height = s.height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fitCanvasToScreen();
        drawAll();
    }

    function updateTimelineUI() {
        const t = window.animationState.currentTime.toFixed(2);
        const d = window.animationState.duration.toFixed(2);
        timeDisplay.textContent = t + 's';
        durationDisplay.textContent = '/ ' + d + 's';
    }

    function updateGlobalDuration(duration) {
        window.animationState.duration = duration;
        updateTimelineUI();
    }
    canvas.addEventListener('contextmenu', (e) => {
        if(selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
            e.preventDefault();
        }
    });
    container.addEventListener('wheel', (e) => {
        if(e.ctrlKey) e.preventDefault();
        if(!e.ctrlKey || viewport.mode !== 'canvas') return;
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = 1 - e.deltaY * 0.0015;
        const prevScale = viewport.scale;
        const newScale = Math.min(Math.max(0.1, prevScale * zoomFactor), 5);
        const worldX = (mouseX - viewport.pointX) / prevScale;
        const worldY = (mouseY - viewport.pointY) / prevScale;
        viewport.scale = newScale;
        viewport.pointX = mouseX - worldX * newScale;
        viewport.pointY = mouseY - worldY * newScale;
        updateCanvasTransform();
    }, {
        passive: false
    });
    canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    canvas.addEventListener('touchstart', onStart, {
        passive: false
    });
    window.addEventListener('touchmove', onMove, {
        passive: false
    });
    window.addEventListener('touchend', onEnd);
    btnSettings.addEventListener('click', () => openPopup(settingsModal));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
    settingsModal.addEventListener('click', e => {
        if(e.target === settingsModal) settingsModal.classList.remove('open');
    });
    document.getElementById('projName').addEventListener('change', e => window.animationState.settings.projectName = e.target.value);
    document.getElementById('projWidth').addEventListener('change', e => {
        window.animationState.settings.width = parseInt(e.target.value);
        initCanvas();
    });
    document.getElementById('projHeight').addEventListener('change', e => {
        window.animationState.settings.height = parseInt(e.target.value);
        initCanvas();
    });
    document.getElementById('projBgColor').addEventListener('input', e => window.animationState.settings.bgColor = e.target.value);
    document.getElementById('projTransparent').addEventListener('change', e => window.animationState.settings.transparent = e.target.checked);
    document.getElementById('animStep').addEventListener('change', e => {
        window.animationState.settings.keyframeStep = parseFloat(e.target.value);
        if(shapeManager) shapeManager.recalculateGlobalDuration();
    });
    document.getElementById('animInterpolate').addEventListener('change', e => window.animationState.settings.interpolate = e.target.checked);
    document.getElementById("removeFillImage").onclick = () => {
        if(!shapeManager.selectedShape) return;
        shapeManager.selectedShape.bgImage = null;
        shapeManager.selectedShape.bgImageObj = null;
        shapeManager.redraw();
    };
    btnPlay.addEventListener('click', () => {
        if(window.animationState.isPlaying) return;
        if(window.animationState.duration === 0) {
            showToast("Add keyframes first!", 'I');
            return;
        }
        window.animationState.isPlaying = true;
        window.animationState.lastFrameTime = performance.now();
        animate(performance.now());
    });
    btnPause.addEventListener('click', () => {
        window.animationState.isPlaying = false;
        cancelAnimationFrame(animationFrameId);
    });
    btnStop.addEventListener('click', () => {
        resetAnimationState();
    });
    btnAddShape.addEventListener('click', () => openPopup(shapeModal));
    closeShapeModalBtn.addEventListener('click', () => shapeModal.classList.remove('open'));
    shapeModal.addEventListener('click', e => {
        if(e.target === shapeModal) shapeModal.classList.remove('open');
    });
    shapeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const x = canvas.width / 2,
                y = canvas.height / 2;
            const s = new Shape(opt.dataset.shape, x, y, 100);
            s.selected = true;
            if(selectedShape) selectedShape.selected = false;
            selectedShape = s;
            if(opt.dataset.shape === 'path') {
                penMode = true;
            } else {
                penMode = false;
            }
            if(window.undoManager) {
                window.undoManager.execute(new ObjectLifecycleCommand(
                    shapes, s, 'add', shapes.length, () => {
                        if(shapeManager) shapeManager.setSelectedShape(s);
                        drawAll();
                    }
                ));
            }
            playhead.style.zIndex = '100';
            playhead.style.top = '0';
            playhead.style.bottom = '0';
        });
    });
    btnAddText.addEventListener('click', () => {
        const text = prompt("Enter text:", "Hello World");
        if(!text) return;
        const s = new Shape('text', canvas.width / 2, canvas.height / 2, 100);
        s.text = text;
        s.selected = true;
        if(selectedShape) selectedShape.selected = false;
        selectedShape = s;
        window.undoManager.execute(
            new ObjectLifecycleCommand(
                shapes,
                s,
                'add',
                shapes.length,
                () => {
                    if(shapeManager) shapeManager.setSelectedShape(s);
                    drawAll();
                }
            )
        );
    });
    btnAddImage.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const s = new Shape('image', canvas.width / 2, canvas.height / 2, 150);
                    s.imageObj = img;
                    s.selected = true;
                    if(selectedShape) selectedShape.selected = false;
                    selectedShape = s;
                    window.undoManager.execute(
                        new ObjectLifecycleCommand(
                            shapes,
                            s,
                            'add',
                            shapes.length,
                            () => {
                                if(shapeManager) shapeManager.setSelectedShape(s);
                                drawAll();
                            }
                        )
                    );
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
        imageInput.value = '';
    });
    if(btnExportVideo) {
        btnExportVideo.addEventListener('click', async () => {
            if(window.animationState.duration === 0) {
                showToast("Add keyframes first!", 'I');
                return;
            }
            if(!confirm(`Export video? This will play the animation from start to finish (${window.animationState.duration.toFixed(1)}s).`)) {
                return;
            }
            exportStatus.style.display = 'block';
            exportStatus.textContent = "Preparing recording...";
            btnExportVideo.disabled = true;
            const stream = canvas.captureStream(60);
            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ?
                "video/webm;codecs=vp9" :
                "video/webm";
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000
            });
            recordedChunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if(event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, {
                    type: "video/webm"
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${window.animationState.settings.projectName.replace(/\s+/g, '_')}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                exportStatus.style.display = 'none';
                btnExportVideo.disabled = false;
                setMode('object');
                drawAll();
            };
            mediaRecorder.start();
            window.animationState.currentTime = 0;
            window.animationState.isPlaying = true;
            window.animationState.lastFrameTime = performance.now();
            const stopTime = window.animationState.duration;
            const recordLoop = (timestamp) => {
                if(!window.animationState.isPlaying) {
                    mediaRecorder.stop();
                    return;
                }
                const deltaTime = (timestamp - window.animationState.lastFrameTime) / 1000;
                window.animationState.lastFrameTime = timestamp;
                window.animationState.currentTime += deltaTime;
                if(window.animationState.currentTime >= stopTime) {
                    window.animationState.currentTime = stopTime;
                    resetAnimationState();
                    drawAll();
                    updatePlayhead();
                    timelineTracksWrapper.scrollLeft = 0;
                    interpolateAndDraw();
                    mediaRecorder.stop();
                    exportStatus.textContent = "Video saved!";
                    setTimeout(() => exportStatus.style.display = 'none', 2000);
                    return;
                }
                updateTimelineUI();
                interpolateAndDraw();
                requestAnimationFrame(recordLoop);
            };
            requestAnimationFrame(recordLoop);
        });
    }
    if(btnOpenEditModal) {
        btnOpenEditModal.addEventListener('click', () => {
            shapeManager.openEditModal();
        });
    }
    if(btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            shapeManager.exitEditMode();
            interpolateAndDraw();
        });
    }
    document.addEventListener('keydown', (e) => {
        if((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if(window.undoManager.undo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        }
        if((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if(window.undoManager.redo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        }
    });

    function updateUndoRedoButtons() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');
        if(!window.undoManager) return;
        const info = window.undoManager.getStackInfo();
        if(btnUndo) btnUndo.disabled = info.undo === 0;
        if(btnRedo) btnRedo.disabled = info.redo === 0;
    }
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if(btnUndo) {
        btnUndo.addEventListener('click', () => {
            if(window.undoManager.undo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        });
    }
    if(btnRedo) {
        btnRedo.addEventListener('click', () => {
            if(window.undoManager.redo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        });
    }

    function updatePlayhead() {
        const x = window.animationState.currentTime * pixelsPerSecond;
        playhead.style.left = x + "px";
        const wrapperWidth = timelineTracksWrapper.clientWidth;
        const tracksHeight = timelineTracks.scrollHeight;
        playhead.style.height = tracksHeight + "px";
        if(x > wrapperWidth / 2) {
            timelineTracksWrapper.scrollLeft = x - wrapperWidth / 2;
        }
    }

    function startTimelineDrag(e) {
        if(!isMobile) {
            if(!e.ctrlKey) return;
        } else {
            if(viewport.mode !== "canvas") return;
        }
        timelineDragging = true;
        timelineDragStartX = e.touches ? e.touches[0].clientX : e.clientX;
        timelineScrollStart = timelineTracksWrapper.scrollLeft;
        timelineTracksWrapper.style.cursor = "grab";
        timelineRuler.style.cursor = "grab";
        e.preventDefault();
    }

    function moveTimelineDrag(e) {
        if(!timelineDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = clientX - timelineDragStartX;
        timelineTracksWrapper.scrollLeft = timelineScrollStart - dx;
        timelineTracksWrapper.style.cursor = "grabbing";
        timelineRuler.style.cursor = "grabbing";
        e.preventDefault();
    }

    function endTimelineDrag() {
        timelineDragging = false;
        timelineTracksWrapper.style.cursor = "default";
        timelineRuler.style.cursor = "default";
    }
    resizeHandle.addEventListener("mousedown", (e) => {
        timelineResizing = true;
        startY = e.clientY;
        startHeight = timelineContainer.offsetHeight;
        document.body.style.cursor = "ns-resize";
    });
    document.addEventListener("mousemove", (e) => {
        if(!timelineResizing) return;
        const dy = startY - e.clientY;
        let newHeight = startHeight + dy;
        newHeight = Math.max(40, newHeight);
        newHeight = Math.min(window.innerHeight * 0.6, newHeight);
        playerTime.style.bottom = (newHeight + 5) + "px";
        timelineContainer.style.height = newHeight + "px";
    });
    document.addEventListener("mouseup", () => {
        timelineResizing = false;
        document.body.style.cursor = "default";
    });
    resizeHandle.addEventListener("touchstart", (e) => {
        resizingTimeline = true;
        startY = e.touches[0].clientY;
        startHeight = timelineContainer.offsetHeight;
    });
    document.addEventListener("touchmove", (e) => {
        if(!resizingTimeline) return;
        const dy = startY - e.touches[0].clientY;
        const newHeight = Math.max(40, startHeight + dy);
        playerTime.style.bottom = (newHeight + 5) + "px";
        timelineContainer.style.height = newHeight + "px";
        updatePlayhead();
    });
    document.addEventListener("touchend", () => {
        resizingTimeline = false;
    });

    function showToast(message, type, duration = 3000) {
        let toastBgColor = '#111111';
        let toastColor = '#eeeeee';
        if(type === 'S') {
            toastBgColor = '#2eb82e';
        } else if(type === 'E') {
            toastBgColor = '#ff5c33';
        } else if(type === 'I') {
            toastBgColor = '#3399ff';
        } else {
            toastBgColor = '#111111';
        }
        const container = document.getElementById("toastContainer");
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.style.color = toastColor;
        toast.style.backgroundColor = toastBgColor;
        toast.innerText = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add("show"));
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    window.updateTimelineSize = function() {
        const duration = window.animationState.duration || 10;
        const timelineWidth = duration * pixelsPerSecond + 800;
        timelineTracks.style.width = timelineWidth + "px";
        timelineRuler.width = timelineWidth;
        drawTimelineRuler();
    }
    timelineTracksWrapper.addEventListener("mousedown", startTimelineDrag);
    timelineRuler.addEventListener("mousedown", startTimelineDrag);
    timelineTracksWrapper.addEventListener("touchstart", startTimelineDrag, {
        passive: false
    });
    timelineRuler.addEventListener("touchstart", startTimelineDrag, {
        passive: false
    });
    window.addEventListener("mousemove", moveTimelineDrag);
    window.addEventListener("touchmove", moveTimelineDrag, {
        passive: false
    });
    window.addEventListener("mouseup", endTimelineDrag);
    window.addEventListener("touchend", endTimelineDrag);
    window.addEventListener("resize", fitCanvasToScreen);
    timelineTracksWrapper.addEventListener("scroll", () => {
        const scrollX = timelineTracksWrapper.scrollLeft;
        timelineRuler.style.transform = `translateX(${-scrollX}px)`;
        trackLabels.scrollTop = timelineTracksWrapper.scrollTop;
    });

    function updateTimelineSize() {
        const duration = window.animationState.duration || 10;
        const width = Math.max(duration * pixelsPerSecond, timelineTracksWrapper.clientWidth + 1);
        timelineTracks.style.width = width + "px";
        timelineRuler.width = width;
        drawTimelineRuler();
    }

    function getRandomColor() {
        const colors = [
            "#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1",
            "#5f27cd", "#ff9f43", "#54a0ff", "#00d2d3"
        ];
        const color = colors[shapeColorIndex % colors.length];
        shapeColorIndex++;
        return color;
    }

    function openPopup(p) {
        const popups = document.querySelectorAll('.modal-overlay');
        popups.forEach(element => {
            element.style.zIndex = 50;
        });
        p.style.zIndex = (popups.length * 50) + 1;
        p.classList.add('open');
    }

    function updateEditModeIndicator() {
        if(selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
            if(penMode) {
                canvas.style.cursor = "crosshair";
            } else {
                canvas.style.cursor = "default";
            }
        } else {
            if(viewport.mode === 'canvas') {
                canvas.style.cursor = viewport.panning ? 'grabbing' : 'grab';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    }

    function groupSelected() {
        if(selectedShapes.length < 2) {
            showToast("Select at least 2 objects to group", 'I');
            return;
        }
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        selectedShapes.forEach(shape => {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x);
            maxY = Math.max(maxY, shape.y);
        });
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const group = new Group(`Group ${shapes.filter(s => s.type === "group").length + 1}`);
        group.x = centerX;
        group.y = centerY;
        const shapesToGroup = [...selectedShapes];
        clearSelection();
        shapesToGroup.forEach(shape => {
            shape._originalWorldX = shape.x;
            shape._originalWorldY = shape.y;
            shape.x = shape.x - centerX;
            shape.y = shape.y - centerY;
            const index = shapes.indexOf(shape);
            if(index !== -1) shapes.splice(index, 1);
            group.children.push(shape);
            //shape.parentGroup = group;
        });
        shapes.push(group);
        selectShape(group);
        rebuildTracks();
        drawAll();
    }

    function ungroupSelected() {
        if(selectedShapes.length !== 1 || selectedShapes[0].type !== "group") {
            showToast("Select a single group to ungroup", 'I');
            return;
        }
        const group = selectedShapes[0];
        const index = shapes.indexOf(group);
        if(index !== -1) shapes.splice(index, 1);
        group.children.forEach(child => {
            child.x = child._originalWorldX || (child.x + group.x);
            child.y = child._originalWorldY || (child.y + group.y);
            shapes.push(child);
        });
        clearSelection();
        rebuildTracks();
        drawAll();
    }
    if(window.updateTimelineSize) {
        window.updateTimelineSize();
    }
    window.addEventListener('DOMContentLoaded', () => {
        const btnPencil = document.getElementById('btnPencil');
        const btnBrush = document.getElementById('btnBrush');
        const btnEraser = document.getElementById('btnEraser');
        const btnFinishDrawing = document.getElementById('btnFinishDrawing');
        const btnCancelDrawing = document.getElementById('btnCancelDrawing');
        const strokeColorPicker = document.getElementById('strokeColorPicker');
        const easingSelect = document.getElementById('easingSelect');
        initCanvas();
        shapeManager = new ShapeManager(shapes, drawAll, () => window.animationState.settings, updateGlobalDuration);
        drawTimelineRuler();
        rebuildTracks();
        updateTimelineUI();
        updateUndoRedoButtons();
        updateTimelineSize();
        setMode('object');
        window.Shape = Shape;
        initFillBucketTool();
        initDrawingCanvas();
        playerTime.style.bottom = '45px';
        timelineContainer.style.height = '40px';
        const btnGroup = document.getElementById('btnGroup');
        const btnUngroup = document.getElementById('btnUngroup');
        if(btnGroup) {
            btnGroup.addEventListener('click', groupSelected);
        }
        if(btnUngroup) {
            btnUngroup.addEventListener('click', ungroupSelected);
        }
        if(btnPencil) {
            btnPencil.addEventListener('click', () => setDrawingTool('pencil'));
        }
        if(btnBrush) {
            btnBrush.addEventListener('click', () => setDrawingTool('brush'));
        }
        if(btnEraser) {
            btnEraser.addEventListener('click', () => setDrawingTool('eraser'));
        }
        if(btnFinishDrawing) {
            btnFinishDrawing.addEventListener('click', () => {
                finishDrawing();
            });
        }
        if(btnCancelDrawing) {
            btnCancelDrawing.addEventListener('click', () => {
                cancelDrawing();
                setDrawingTool(null);
            });
        }
        if(strokeColorPicker) {
            strokeColorPicker.addEventListener('change', (e) => updateStrokeColor(e.target.value));
        }
        const strokeWidthContainer = document.getElementById('strokeWidthContainer');
        if(strokeWidthContainer) {
            const strokeWidthSlider = createRNSlider({
                label: 'Width',
                value: 2,
                min: 1,
                max: 20,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => updateStrokeWidth(v)
            });
            strokeWidthContainer.appendChild(strokeWidthSlider);
        }
        const strokeOpacityContainer = document.getElementById('strokeOpacityContainer');
        if(strokeOpacityContainer) {
            const strokeOpacitySlider = createRNSlider({
                label: 'Opacity',
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => updateStrokeOpacity(v)
            });
            strokeOpacityContainer.appendChild(strokeOpacitySlider);
        }
        const eraserSizeContainer = document.getElementById('eraserSizeContainer');
        if(eraserSizeContainer) {
            const eraserSizeSlider = createRNSlider({
                label: 'Size',
                value: 20,
                min: 5,
                max: 50,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => {
                    if(typeof updateEraserSize === 'function') updateEraserSize(v);
                }
            });
            eraserSizeContainer.appendChild(eraserSizeSlider);
        }
        if(easingSelect) {
            easingSelect.addEventListener('change', (e) => {
                window.animationState.settings.easing = e.target.value;
                shapes.forEach(shape => shapeManager.buildTrack(shape));
                drawAll();
            });
        }
        const brushSpacingContainer = document.getElementById('brushSpacingContainer');
        if(brushSpacingContainer) {
            const brushSpacingSlider = createRNSlider({
                label: 'Spacing',
                value: 5,
                min: 2,
                max: 20,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => setBrushSpacing(v)
            });
            brushSpacingContainer.appendChild(brushSpacingSlider);
        }
        const glowIntensityContainer = document.getElementById('glowIntensityContainer');
        if(glowIntensityContainer) {
            const glowIntensitySlider = createRNSlider({
                label: 'Intensity',
                value: 10,
                min: 2,
                max: 30,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => setGlowIntensity(v)
            });
            glowIntensityContainer.appendChild(glowIntensitySlider);
        }
        const minTaperWidthSlider = createRNSlider({
            label: 'Start Width',
            value: 1,
            min: 1,
            max: 20,
            step: 1,
            orientation: 'horizontal',
            width: 280,
            height: 50,
            onChange: (v) => setMinTaperWidth(v)
        });
        document.getElementById('minTaperWidthSlider')?.appendChild(minTaperWidthSlider);
        const maxTaperWidthSlider = createRNSlider({
            label: 'End Width',
            value: 20,
            min: 1,
            max: 30,
            step: 1,
            orientation: 'horizontal',
            width: 280,
            height: 50,
            onChange: (v) => setMaxTaperWidth(v)
        });
        document.getElementById('maxTaperWidthSlider')?.appendChild(maxTaperWidthSlider);
        const stabilizationSlider = document.getElementById('stabilizationSlider');
        if(stabilizationSlider) {
            stabilizationSlider.addEventListener('input', (e) => {
                setStabilizationLevel(e.target.value);
            });
        }
        const stabilizationSliderContainer = document.getElementById('stabilizationSliderContainer');
        if(stabilizationSliderContainer) {
            const stabilizationSlider = createRNSlider({
                label: 'Stabilization',
                value: stabilizationLevel || 5,
                min: 0,
                max: 20,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => {
                    if(typeof setStabilizationLevel === 'function') {
                        setStabilizationLevel(v);
                    }
                }
            });
            stabilizationSliderContainer.appendChild(stabilizationSlider);
        }
        const smoothingSelect = document.getElementById('smoothingSelect');
        if(smoothingSelect) {
            smoothingSelect.addEventListener('change', (e) => {
                setSmoothingAlgorithm(e.target.value);
            });
        }
        initDragAndDropImport();
        
        // Help Modal
        const btnHelp = document.getElementById('btnHelp');
        const helpModal = document.getElementById('helpModal');
        const closeHelpBtn = document.getElementById('closeHelpBtn');
        
        if (btnHelp) {
            btnHelp.addEventListener('click', () => {
                loadHelpContent();
                openPopup(helpModal);
            });
        }
        
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => {
                helpModal.classList.remove('open');
            });
        }
        
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    helpModal.classList.remove('open');
                }
            });
        }
        
        // About Modal
        const btnAbout = document.getElementById('btnAbout');
        const aboutModal = document.getElementById('aboutModal');
        const closeAboutBtn = document.getElementById('closeAboutBtn');
        
        if (btnAbout) {
            btnAbout.addEventListener('click', () => {
                openPopup(aboutModal);
            });
        }
        
        if (closeAboutBtn) {
            closeAboutBtn.addEventListener('click', () => {
                aboutModal.classList.remove('open');
            });
        }
        
        if (aboutModal) {
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    aboutModal.classList.remove('open');
                }
            });
        }
        
        // About modal buttons
        const btnWebsite = document.getElementById('btnWebsite');
        const btnReportIssue = document.getElementById('btnReportIssue');
        
        if (btnWebsite) {
            btnWebsite.addEventListener('click', () => {
                window.open('https://your-website.com', '_blank');
            });
        }
        
        if (btnReportIssue) {
            btnReportIssue.addEventListener('click', () => {
                window.open('https://github.com/yourusername/mr-animator/issues', '_blank');
            });
        }
        
        // Stroke Hardness Slider
        const strokeHardnessContainer = document.getElementById('strokeHardnessContainer');
        if(strokeHardnessContainer) {
            const hardnessSlider = createRNSlider({
                label: 'Hardness',
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => {
                    if(typeof updateStrokeHardness === 'function') updateStrokeHardness(v);
                }
            });
            strokeHardnessContainer.appendChild(hardnessSlider);
        }
        
        // Eraser Hardness Slider
        const eraserHardnessContainer = document.getElementById('eraserHardnessContainer');
        if(eraserHardnessContainer) {
            const eraserHardnessSlider = createRNSlider({
                label: 'Hardness',
                value: 100,
                min: 0,
                max: 100,
                step: 1,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => {
                    if(typeof updateEraserHardness === 'function') updateEraserHardness(v);
                }
            });
            eraserHardnessContainer.appendChild(eraserHardnessSlider);
        }
    });
    
    // Selection Tool functions
    function activateSelectionTool() {
        // Deactivate all drawing tools
        if (typeof setDrawingTool === 'function') {
            finishDrawing();
            cancelDrawing();
            setDrawingTool(null);
        }
        
        // Deactivate fill bucket tool
        if (typeof setFillBucketTool === 'function') {
            setFillBucketTool(false);
        }
        
        // Deactivate pen mode
        penMode = false;
        isEditingPolyline = false;
        isEditingPoint = false;
        
        // Reset cursor
        canvas.style.cursor = 'default';
        
        // Update UI
        selectionToolActive = true;
        
        // Update button states
        const btnSelectionTool = document.getElementById('btnSelectionTool');
        const btnModeObject = document.getElementById('btnModeObject');
        const btnModeCanvas = document.getElementById('btnModeCanvas');
        const btnPencil = document.getElementById('btnPencil');
        const btnBrush = document.getElementById('btnBrush');
        const btnEraser = document.getElementById('btnEraser');
        
        if (btnSelectionTool) btnSelectionTool.classList.add('mode-active');
        if (btnModeObject) btnModeObject.classList.remove('mode-active');
        if (btnModeCanvas) btnModeCanvas.classList.remove('mode-active');
        if (btnPencil) btnPencil.classList.remove('mode-active');
        if (btnBrush) btnBrush.classList.remove('mode-active');
        if (btnEraser) btnEraser.classList.remove('mode-active');
        
        // Hide brush type selector
        const brushTypeSelector = document.getElementById('brushTypeSelector');
        if (brushTypeSelector) brushTypeSelector.style.display = 'none';
    }
    
    function deactivateSelectionTool() {
        selectionToolActive = false;
        const btnSelectionTool = document.getElementById('btnSelectionTool');
        if (btnSelectionTool) btnSelectionTool.classList.remove('mode-active');
    }
    
    // Update setMode function to work with selection tool
    const originalSetMode = setMode;
    setMode = function(mode) {
        if (mode === 'object') {
            // When switching to object mode, activate selection tool
            activateSelectionTool();
        } else if (mode === 'canvas') {
            deactivateSelectionTool();
        }
        if (originalSetMode) originalSetMode(mode);
    };
    
    // Add selection tool button event listener
    const btnSelectionTool = document.getElementById('btnSelectionTool');
    if (btnSelectionTool) {
        btnSelectionTool.addEventListener('click', () => {
            if(selectionToolActive){ 
                deactivateSelectionTool();
            } else {
                if (viewport.mode !== 'object') {
                    setMode('object');
                    deactivateSelectionTool();
                } else {
                    activateSelectionTool();
                }
            }
        });
    }

    function importProject() {
        const fileInput = document.getElementById('importFileInput');
        if(fileInput) {
            fileInput.click();
        }
    }

    function loadProjectFromJSON(jsonData, skipConfirm = false) {
        const hasExistingWork = shapes.length > 0;
        if(hasExistingWork && !skipConfirm) {
            showConfirmDialog(
                "Load Project",
                "You have unsaved work. Loading a new project will replace your current work. Are you sure?",
                () => {
                    performLoadProject(jsonData);
                },
                () => {
                    showToast("Import cancelled", 'I');
                }
            );
            return;
        }
        performLoadProject(jsonData);
    }

    function showConfirmDialog(title, message, onConfirm, onCancel) {
        const popups = document.querySelectorAll('.modal-overlay');
        popups.forEach(element => {
            element.style.zIndex = 50;
        });
        let confirmModal = document.getElementById('confirmDialog');
        if(!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = 'confirmDialog';
            confirmModal.className = 'modal-overlay';
            confirmModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
        `;
            confirmModal.style.zIndex = (popups.length * 50) + 1000;
            confirmModal.classList.add('open');
            confirmModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="popup-header">
                    <span class="popup-title" id="confirmTitle">Confirm</span>
                    <button class="close-popup-btn" id="closeConfirmBtn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="popup-body">
                    <p id="confirmMessage" style="margin-bottom: 20px;">Are you sure?</p>
                    <div class="btn-grid" style="grid-template-columns: 1fr 1fr;">
                        <button class="action-btn" id="confirmCancelBtn">Cancel</button>
                        <button class="action-btn btn-primary" id="confirmOkBtn">OK</button>
                    </div>
                </div>
            </div>
        `;
            document.body.appendChild(confirmModal);
        }
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        const closeBtn = document.getElementById('closeConfirmBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const okBtn = document.getElementById('confirmOkBtn');
        const newCloseBtn = closeBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newOkBtn = okBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const closeDialog = () => {
            confirmModal.remove();
            if(onCancel) onCancel();
        };
        newCloseBtn.addEventListener('click', closeDialog);
        newCancelBtn.addEventListener('click', closeDialog);
        newOkBtn.addEventListener('click', () => {
            confirmModal.remove();
            if(onConfirm) onConfirm();
        });
        confirmModal.addEventListener('click', (e) => {
            if(e.target === confirmModal) {
                closeDialog();
            }
        });
        confirmModal.classList.add('open');
    }

    function closeDialog() {
        const confDlg = document.getElementById('confirmDialog');
        if(confDlg) confDlg.remove();
    }

    function performLoadProject(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if(!data.version || !data.settings || !data.shapes) {
                showToast("Invalid project file format", 'E');
                return false;
            }
            const oldShapes = [...shapes];
            const oldSettings = JSON.parse(JSON.stringify(window.animationState.settings));
            const oldDuration = window.animationState.duration;
            shapes = [];
            for(let shapeData of data.shapes) {
                let newShape;
                if(shapeData.type === 'group') {
                    newShape = new Group(shapeData.name);
                    newShape.x = shapeData.x;
                    newShape.y = shapeData.y;
                    newShape.rotation = shapeData.rotation;
                    newShape.scaleX = shapeData.scaleX;
                    newShape.scaleY = shapeData.scaleY;
                    newShape.skewX = shapeData.skewX;
                    newShape.skewY = shapeData.skewY;
                    newShape.pivotX = shapeData.pivotX;
                    newShape.pivotY = shapeData.pivotY;
                    newShape.opacity = shapeData.opacity;
                    newShape.color = shapeData.color;
                    newShape.borderColor = shapeData.borderColor;
                    newShape.borderWidth = shapeData.borderWidth;
                    newShape.shadowColor = shapeData.shadowColor;
                    newShape.shadowBlur = shapeData.shadowBlur;
                    newShape.shadowOffsetX = shapeData.shadowOffsetX;
                    newShape.shadowOffsetY = shapeData.shadowOffsetY;
                    newShape.shadowOpacity = shapeData.shadowOpacity;
                    newShape.expanded = shapeData.expanded;
                    if(shapeData.children) {
                        for(let childData of shapeData.children) {
                            const child = recreateShape(childData);
                            if(child) {
                                child.parentGroup = newShape;
                                newShape.children.push(child);
                            }
                        }
                    }
                } else if(shapeData.type === 'drawing') {
                    newShape = new Shape('drawing', shapeData.x, shapeData.y, shapeData.size);
                    newShape.segments = shapeData.segments || [];
                    newShape.segmentColors = shapeData.segmentColors || [];
                    newShape.segmentWidths = shapeData.segmentWidths || [];
                    newShape.segmentOpacities = shapeData.segmentOpacities || [];
                    newShape.segmentBrushTypes = shapeData.segmentBrushTypes || [];
                    newShape.segmentTaperStarts = shapeData.segmentTaperStarts || [];
                    newShape.segmentTaperEnds = shapeData.segmentTaperEnds || [];
                    newShape.isDrawing = true;
                    newShape.finished = true;
                    newShape.editable = false;
                } else {
                    newShape = recreateShape(shapeData);
                }
                if(newShape) {
                    if(shapeData.keyframes && shapeData.keyframes.length > 0) {
                        newShape.keyframes = shapeData.keyframes;
                    }
                    shapes.push(newShape);
                }
            }
            window.animationState.settings = data.settings;
            let maxTime = 0;
            for(let shape of shapes) {
                for(let kf of shape.keyframes) {
                    if(kf.time > maxTime) {
                        maxTime = kf.time;
                    }
                }
            }
            window.animationState.duration = maxTime + (1 / window.animationState.fps);
            if(typeof updateGlobalDuration === 'function') {
                updateGlobalDuration(window.animationState.duration);
            }
            if(shapeManager && typeof shapeManager.buildTrack === 'function') {
                for(let shape of shapes) {
                    shapeManager.buildTrack(shape);
                }
            }
            if(typeof initCanvas === 'function') {
                initCanvas();
            }
            if(typeof rebuildTracks === 'function') {
                rebuildTracks();
            }
            if(typeof drawTimelineRuler === 'function') {
                drawTimelineRuler();
            }
            if(typeof updateTimelineSize === 'function') {
                updateTimelineSize();
            }
            if(typeof drawAll === 'function') {
                drawAll();
            }
            if(typeof clearSelection === 'function') {
                clearSelection();
            }
            if(typeof window.seekAnimation === 'function') {
                window.seekAnimation(0);
            }
            if(typeof updateUndoRedoButtons === 'function') {
                updateUndoRedoButtons();
            }
            if(window.undoManager) {
                const importCommand = {
                    execute: () => {},
                    undo: () => {
                        shapes = oldShapes;
                        window.animationState.settings = oldSettings;
                        window.animationState.duration = oldDuration;
                        if(typeof initCanvas === 'function') initCanvas();
                        if(typeof rebuildTracks === 'function') rebuildTracks();
                        if(typeof drawTimelineRuler === 'function') drawTimelineRuler();
                        if(typeof updateTimelineSize === 'function') updateTimelineSize();
                        if(typeof drawAll === 'function') drawAll();
                        if(typeof clearSelection === 'function') clearSelection();
                        if(typeof window.seekAnimation === 'function') window.seekAnimation(0);
                        showToast("Import undone", 'I');
                    }
                };
                window.undoManager.execute(importCommand);
            }
            showToast(`Project loaded successfully! Duration: ${window.animationState.duration.toFixed(2)}s`, 'S');
            return true;
        } catch (error) {
            console.error("Import error:", error);
            showToast("Failed to load project: " + error.message, 'E');
            return false;
        }
    }

    function recreateShape(shapeData) {
        const shape = new Shape(shapeData.type, shapeData.x, shapeData.y, shapeData.size);
        const props = ['rotation', 'scaleX', 'scaleY', 'skewX', 'skewY', 'pivotX', 'pivotY',
            'opacity', 'color', 'borderWidth', 'borderColor', 'borderOffset', 'borderBlur',
            'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'shadowOpacity',
            'text', 'fontSize', 'fontFamily', 'filterBrightness', 'filterContrast',
            'filterSaturation', 'filterBlur', 'bgImage', 'bgFit', 'bgOffsetX', 'bgOffsetY',
            'bgScale', 'cornerRadius', 'sides', 'finished', 'editable'
        ];
        for(let prop of props) {
            if(shapeData[prop] !== undefined) {
                shape[prop] = shapeData[prop];
            }
        }
        if(shapeData.points) {
            shape.points = JSON.parse(JSON.stringify(shapeData.points));
        }
        if(shapeData.segments) {
            shape.segments = JSON.parse(JSON.stringify(shapeData.segments));
        }
        if(shapeData.keyframes && shapeData.keyframes.length > 0) {
            shape.keyframes = JSON.parse(JSON.stringify(shapeData.keyframes));
        } else {
            shape.keyframes = [];
        }
        if(shapeData.bgImage) {
            shape.bgImage = shapeData.bgImage;
            const img = new Image();
            img.src = shapeData.bgImage;
            shape.bgImageObj = img;
        }
        if(shapeData.imageObj && shapeData.imageObj.src) {
            const img = new Image();
            img.src = shapeData.imageObj.src;
            shape.imageObj = img;
        }
        return shape;
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            loadProjectFromJSON(e.target.result);
        };
        reader.onerror = () => {
            showToast("Error reading file", 'E');
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function verifyKeyframesAfterImport() {
        console.log("=== Verifying imported project ===");
        console.log("Total shapes:", shapes.length);
        console.log("Duration:", window.animationState.duration);
        for(let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            console.log(`Shape ${i+1} (${shape.type}): ${shape.keyframes.length} keyframes`);
            if(shape.keyframes.length > 0) {
                console.log("  Keyframes:", shape.keyframes.map(kf => kf.time.toFixed(2)).join(", "));
            }
        }
        if(window.animationState.duration === 0) {
            console.warn("WARNING: Duration is 0! No keyframes found or duration not calculated.");
        }
    }
    document.getElementById('btnImportProject')?.addEventListener('click', importProject);
    document.getElementById('importFileInput')?.addEventListener('change', handleImportFile);

    function initDragAndDropImport() {
        const container = document.getElementById('animContainer');
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.opacity = '0.7';
        });
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            container.style.opacity = '1';
        });
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.style.opacity = '1';
            const file = e.dataTransfer.files[0];
            if(file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if(shapes.length > 0) {
                        showConfirmDialog(
                            "Load Project",
                            "You have unsaved work. Loading a new project will replace your current work. Are you sure?",
                            () => {
                                loadProjectFromJSON(event.target.result, true);
                            },
                            () => {
                                showToast("Import cancelled", 'I');
                            }
                        );
                    } else {
                        loadProjectFromJSON(event.target.result, true);
                    }
                };
                reader.readAsText(file);
            } else {
                showToast("Please drop a JSON project file", 'I');
            }
        });
    }
    
    function clearAllSelections() {
        for (let shape of shapes) {
            shape.selected = false;
        }
        selectedShapes = [];
        selectedShape = null;
        if (shapeManager) shapeManager.setSelectedShape(null);
        if (typeof updateSelectionDisplay === 'function') {
            updateSelectionDisplay();
        }
        drawAll();
    }