    function drawTimelineRuler() {
        const ctx = timelineRuler.getContext("2d");
        const duration = window.animationState.animationDuration || 60;
        const totalWidth = duration * pixelsPerSecond + 200;
        
        const visibleWidth = timelineTracksWrapper.clientWidth;
        timelineRuler.width = visibleWidth;
        timelineRuler.style.width = visibleWidth + "px";
        timelineRuler.height = 39;
        ctx.clearRect(0, 0, visibleWidth, 39);
        
        const scrollLeft = timelineTracksWrapper.scrollLeft;
        const startX = scrollLeft;
        const endX = scrollLeft + visibleWidth;
        const bottom = timelineRuler.height;
        
        if (pixelsPerSecond >= 200) {
            subdivisions = 20;
        } else if (pixelsPerSecond >= 150) {
            subdivisions = 15;
        } else if (pixelsPerSecond >= 100) {
            subdivisions = 10;
        } else if (pixelsPerSecond >= 50) {
            subdivisions = 5;
        } else {
            subdivisions = 2;
        }
        
        if (loopEnabled) {
            const loopStartX = loopStartTime * pixelsPerSecond;
            const loopEndX = loopEndTime * pixelsPerSecond;
            
            const drawStartX = Math.max(0, loopStartX - startX);
            const drawEndX = Math.min(visibleWidth, loopEndX - startX);
            
            if (drawStartX < drawEndX) {
                ctx.fillStyle = "rgba(0, 212, 255, 0.2)";
                ctx.fillRect(drawStartX, 0, drawEndX - drawStartX, bottom);
                
                if (loopStartX >= startX && loopStartX <= endX) {
                    ctx.beginPath();
                    ctx.moveTo(loopStartX - startX, 0);
                    ctx.lineTo(loopStartX - startX, bottom);
                    ctx.strokeStyle = "#00d4ff";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.fillStyle = "#00d4ff";
                    ctx.fillText("Loop Start", loopStartX - startX + 4, bottom - 5);
                }
                
                if (loopEndX >= startX && loopEndX <= endX) {
                    ctx.beginPath();
                    ctx.moveTo(loopEndX - startX, 0);
                    ctx.lineTo(loopEndX - startX, bottom);
                    ctx.strokeStyle = "#ff9f43";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.fillStyle = "#ff9f43";
                    ctx.fillText("Loop End", loopEndX - startX + 4, bottom - 5);
                }
            }
        }
        
        const startTime = startX / pixelsPerSecond;
        const endTime = endX / pixelsPerSecond;
        const startSecond = Math.floor(startTime);
        const endSecond = Math.ceil(endTime) + 1;
        
        for(let s = startSecond; s <= endSecond; s++) {
            const x = s * pixelsPerSecond;
            const drawX = x - startX;
            
            if (drawX >= -120 && drawX <= visibleWidth + 120) {
                ctx.strokeStyle = "#666";
                ctx.beginPath();
                ctx.moveTo(drawX, bottom);
                ctx.lineTo(drawX, bottom - 20);
                ctx.stroke();
                ctx.fillStyle = "#666";
                ctx.font = "10px sans-serif";
                ctx.fillText(s + "s", drawX + 4, bottom - 22);
                
                for(let sub = 1; sub < subdivisions; sub++) {
                    const subX = x + (sub * pixelsPerSecond / subdivisions);
                    const subDrawX = subX - startX;
                    if (subDrawX >= -10 && subDrawX <= visibleWidth + 10) {
                        ctx.strokeStyle = "#666";
                        ctx.beginPath();
                        ctx.moveTo(subDrawX, bottom);
                        ctx.lineTo(subDrawX, bottom - 10);
                        ctx.stroke();
                        
                        if (pixelsPerSecond >= 300 && sub % 5 === 0) {
                            ctx.fillStyle = "#666";
                            ctx.font = "8px sans-serif";
                            const subTime = (sub * (1 / subdivisions)).toFixed(1);
                            ctx.fillText(subTime + "s", subDrawX + 2, bottom - 15);
                        }
                    }
                }
            }
        }
        
        bookmarks.forEach(bookmark => {
            const x = bookmark.time * pixelsPerSecond;
            const drawX = x - startX;
            if (drawX >= 0 && drawX <= visibleWidth) {
                ctx.beginPath();
                ctx.moveTo(drawX, 0);
                ctx.lineTo(drawX, bottom);
                ctx.strokeStyle = bookmark.isLoopStart ? "#00d4ff" : (bookmark.isLoopEnd ? "#ff9f43" : "#ff5ec4");
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(drawX, 5);
                ctx.lineTo(drawX + 6, 12);
                ctx.lineTo(drawX, 19);
                ctx.lineTo(drawX - 6, 12);
                ctx.closePath();
                ctx.fillStyle = bookmark.isLoopStart ? "#00d4ff" : (bookmark.isLoopEnd ? "#ff9f43" : "#ff5ec4");
                ctx.fill();
                
                ctx.fillStyle = "#666";
                ctx.font = "9px sans-serif";
                const label = bookmark.name.length > 15 ? bookmark.name.substring(0, 12) + "..." : bookmark.name;
                ctx.fillText(label, drawX + 8, 14);
            }
        });
        
        const currentX = window.animationState.currentTime * pixelsPerSecond;
        const drawCurrentX = currentX - startX;
        if (drawCurrentX >= 0 && drawCurrentX <= visibleWidth) {
            ctx.beginPath();
            ctx.moveTo(drawCurrentX, 0);
            ctx.lineTo(drawCurrentX, bottom);
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function addBookmark(time, name = null) {
        time = Math.max(0, Math.min(time, window.animationState.duration));
        
        const existing = bookmarks.find(b => Math.abs(b.time - time) < 0.05);
        if (existing) {
            showToast("Bookmark already exists at this time", 'I');
            return existing;
        }
        
        if (time >= window.animationState.duration - 0.1) {
            const newDuration = time + 60;
            window.animationState.duration = newDuration;
            
            if (typeof updateTimelineSize === 'function') updateTimelineSize();
            if (typeof drawTimelineRuler === 'function') drawTimelineRuler();
            if (typeof updateTimelineUI === 'function') updateTimelineUI();
            if (typeof rebuildTracks === 'function') rebuildTracks();
        }
        
        const bookmark = {
            id: Date.now(),
            time: time,
            name: name || `ðŸ“Œ ${time.toFixed(2)}s`,
            isLoopStart: false,
            isLoopEnd: false
        };
    
        bookmarks.push(bookmark);
        bookmarks.sort((a, b) => a.time - b.time);
        
        window.bookmarks = bookmarks;
        
        if (typeof drawTimelineRuler === 'function') drawTimelineRuler();
        if (typeof rebuildTracks === 'function') rebuildTracks();
        
        return bookmark;
    }
    
    function removeBookmark(bookmark) {
        const index = bookmarks.indexOf(bookmark);
        if (index !== -1) {
            bookmarks.splice(index, 1);
            window.bookmarks = bookmarks;
            drawTimelineRuler();
        }
    }

    function getTimelineTimeFromClick(clientX) {
        const rulerRect = timelineRuler.getBoundingClientRect();
        if (clientX < rulerRect.left || clientX > rulerRect.right) return 0;
        
        const scrollLeft = timelineTracksWrapper.scrollLeft;
        const clickX = clientX - rulerRect.left;
        const absoluteX = clickX + scrollLeft;
        const time = absoluteX / pixelsPerSecond;
        
        return time; //Math.max(0, Math.min(time, window.animationState.duration));
    }
    
    function updateAllKeyframePositions() {
        const keyframes = document.querySelectorAll('.keyframe');
        keyframes.forEach(kf => {
            const time = parseFloat(kf.getAttribute('data-time'));
            if (time) {
                kf.style.left = (time * pixelsPerSecond) + "px";
            }
        });
    }

    function findBookmarkAtPosition(clientX) {
        const rulerRect = timelineRuler.getBoundingClientRect();
        if (clientX < rulerRect.left || clientX > rulerRect.right) return null;
        
        const scrollLeft = timelineTracksWrapper.scrollLeft;
        const clickX = clientX - rulerRect.left;
        const absoluteX = clickX + scrollLeft;
        
        for (let bookmark of bookmarks) {
            const bookmarkX = bookmark.time * pixelsPerSecond;
            if (Math.abs(bookmarkX - absoluteX) < 10) {
                return bookmark;
            }
        }
        return null;
    }

    function showBookmarkMenu(bookmark, clientX, clientY) {
        const menu = document.getElementById('bookmarkMenuModal');
        if (!menu) return;

        selectedBookmark = bookmark;

        menu.style.display = 'flex';
        menu.style.position = 'fixed';
        menu.style.left = clientX + 'px';
        menu.style.top = clientY + 'px';
        menu.style.zIndex = '10000';

        const btnSetStart = document.getElementById('bookmarkSetLoopStart');
        const btnSetEnd = document.getElementById('bookmarkSetLoopEnd');
        const btnRemove = document.getElementById('bookmarkRemove');
        const btnCancel = document.getElementById('bookmarkCancel');
        const btnClearLoop = document.getElementById('clearLoop');

        const closeMenu = () => {
            menu.style.display = 'none';
            selectedBookmark = null;
        };

        const newBtnSetStart = btnSetStart.cloneNode(true);
        const newBtnSetEnd = btnSetEnd.cloneNode(true);
        const newBtnRemove = btnRemove.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        const newBtnClearLoop = btnClearLoop.cloneNode(true);

        btnSetStart.parentNode.replaceChild(newBtnSetStart, btnSetStart);
        btnSetEnd.parentNode.replaceChild(newBtnSetEnd, btnSetEnd);
        btnRemove.parentNode.replaceChild(newBtnRemove, btnRemove);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        btnClearLoop.parentNode.replaceChild(newBtnClearLoop, btnClearLoop);

        newBtnSetStart.onclick = () => {
            setLoopStartFromBookmark(bookmark);
            closeMenu();
        };

        newBtnSetEnd.onclick = () => {
            setLoopEndFromBookmark(bookmark);
            closeMenu();
        };

        newBtnRemove.onclick = () => {
            removeBookmark(bookmark);
            closeMenu();
        };

        newBtnClearLoop.onclick = () => {
            clearLoop();
            closeMenu();
        };

        newBtnCancel.onclick = closeMenu;

        menu.classList.add('open');
    }

    function setLoopStartFromBookmark(bookmark) {
        loopStartTime = bookmark.time;
        loopEnabled = true;

        bookmarks.forEach(b => b.isLoopStart = false);
        bookmark.isLoopStart = true;

        if (loopStartTime >= loopEndTime) {
            loopEndTime = Math.min(loopStartTime + 1, window.animationState.duration);
        }

        drawTimelineRuler();

        const btnLoop = document.getElementById('btnLoop');
        if (btnLoop) {
            btnLoop.classList.add('mode-active');
            btnLoop.style.color = 'var(--accent)';
        }
    }

    function setLoopEndFromBookmark(bookmark) {
        loopEndTime = bookmark.time;
        loopEnabled = true;

        bookmarks.forEach(b => b.isLoopEnd = false);
        bookmark.isLoopEnd = true;

        if (loopEndTime <= loopStartTime) {
            loopStartTime = Math.max(0, loopEndTime - 1);
        }

        drawTimelineRuler();

        const btnLoop = document.getElementById('btnLoop');
        if (btnLoop) {
            btnLoop.classList.add('mode-active');
            btnLoop.style.color = 'var(--accent)';
        }
    }

    function toggleLoop() {
        loopEnabled = !loopEnabled;
        const btnLoop = document.getElementById('btnLoop');
        if (btnLoop) {
            if (loopEnabled) {
                btnLoop.classList.add('mode-active');
                btnLoop.style.color = 'var(--accent)';
                showToast(`Loop enabled (${loopStartTime.toFixed(1)}s - ${loopEndTime.toFixed(1)}s)`, 'S');
            } else {
                btnLoop.classList.remove('mode-active');
                btnLoop.style.color = '';
                showToast("Loop disabled", 'I');
            }
        }
        drawTimelineRuler();
    }

    function clearLoop() {
        loopEnabled = false;
        loopStartTime = 0;
        loopEndTime = window.animationState.duration;

        bookmarks.forEach(b => {
            b.isLoopStart = false;
            b.isLoopEnd = false;
        });

        const btnLoop = document.getElementById('btnLoop');
        if (btnLoop) {
            btnLoop.classList.remove('mode-active');
            btnLoop.style.color = '';
        }
        drawTimelineRuler();
    }

    function resetLoopTimes() {
        loopEndTime = window.animationState.duration;
        if (loopStartTime >= loopEndTime) {
            loopStartTime = Math.max(0, loopEndTime - 5);
        }
        drawTimelineRuler();
    }

    function initTimelineRulerEvents() {

        timelineRuler.addEventListener('mousedown', (e) => {
            if (e.ctrlKey || e.button == 2) {
                return;
            }
            
            const time = getTimelineTimeFromClick(e.clientX);
            if (window.seekAnimation) {
                window.seekAnimation(time);
            }

            const bookmark = findBookmarkAtPosition(e.clientX);
            if (bookmark) {
                e.preventDefault();
                e.stopPropagation();
                showBookmarkMenu(bookmark, e.clientX, e.clientY);
                return;
            }
        });

        timelineRuler.addEventListener('dblclick', (e) => {
            if (e.ctrlKey) return;
        
            e.preventDefault();
            e.stopPropagation();
            let time = getTimelineTimeFromClick(e.clientX);
            
            if (time >= window.animationState.duration - 0.1) {
                const newDuration = time + 60;
                window.animationState.duration = newDuration;
                if (typeof updateTimelineSize === 'function') updateTimelineSize();
                if (typeof drawTimelineRuler === 'function') drawTimelineRuler();
                if (typeof updateTimelineUI === 'function') updateTimelineUI();
                if (typeof rebuildTracks === 'function') rebuildTracks();
            }
            
            const bookmark = addBookmark(time);
        
            setTimeout(() => {
                showPrompt("Enter bookmark name:", bookmark.name, (newName) => {
                    if (newName && newName.trim()) {
                        bookmark.name = newName;
                        if (typeof drawTimelineRuler === 'function') drawTimelineRuler();
                    }
                });
            }, 50);
        });

        timelineRuler.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let time = getTimelineTimeFromClick(e.clientX);
            
            if (time >= window.animationState.duration - 0.1) {
                const newDuration = time + 60;
                window.animationState.duration = newDuration;
                if (typeof updateTimelineSize === 'function') updateTimelineSize();
                if (typeof drawTimelineRuler === 'function') drawTimelineRuler();
                if (typeof updateTimelineUI === 'function') updateTimelineUI();
                if (typeof rebuildTracks === 'function') rebuildTracks();
            }
            
            addBookmark(time);
        });

        timelineRuler.addEventListener('mousemove', (e) => {
            if (e.ctrlKey) {
                timelineRuler.style.cursor = 'grab';
            } else {
                const bookmark = findBookmarkAtPosition(e.clientX);
                if (bookmark) {
                    timelineRuler.style.cursor = 'pointer';
                } else {
                    timelineRuler.style.cursor = 'crosshair';
                }
            }
        });

        timelineRuler.addEventListener('mouseleave', () => {
            timelineRuler.style.cursor = 'pointer';
        });
    }

    function setMode(mode) {
        viewport.mode = mode;
        const container = document.getElementById('animContainer');
        
        if (mode === 'canvas') {
            container.classList.add('canvas-mode');
            btnModeCanvas.classList.add('mode-active');
            btnModeObject.classList.remove('mode-active');
            canvas.style.cursor = 'grab';
        } else {
            container.classList.remove('canvas-mode');
            btnModeObject.classList.add('mode-active');
            btnModeCanvas.classList.remove('mode-active');
            canvas.style.cursor = 'default';
        }
    }

    function fitCanvasToScreen() {
        const s = window.animationState.settings;
        const timelineHeight = timelineContainer.offsetHeight;

        const containerRect = container.getBoundingClientRect();
        const availableHeight = containerRect.height - timelineHeight;

        const scaleX = containerRect.width / s.width;
        const scaleY = availableHeight / s.height;
        const fitScale = Math.min(scaleX, scaleY) * 0.95;
        viewport.scale = fitScale;

        const canvasWidth = s.width * fitScale;
        const canvasHeight = s.height * fitScale;

        viewport.pointX = (containerRect.width - canvasWidth) / 2;
        viewport.pointY = (availableHeight - canvasHeight) / 2;

        updateCanvasTransform();
    }

    function updateCanvasTransform() {
        canvas.style.transform = `translate(${viewport.pointX}px, ${viewport.pointY}px) scale(${viewport.scale})`;
        canvas.style.transformOrigin = "top left";
        if (drawingCanvas) {
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
        window.animationState.animationDuration = duration + 60;
        updateTimelineUI();
    }

    function getLastKeyframeTime() {
        let maxTime = 0;
        shapes.forEach(shape => {
            shape.keyframes.forEach(kf => {
                if (kf.time > maxTime) {
                    maxTime = kf.time;
                }
            });
        });
        return maxTime;
    }
    canvas.addEventListener('contextmenu', (e) => {
        if (selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
            e.preventDefault();
        }
    });
    container.addEventListener('wheel', (e) => {
        if (e.ctrlKey) e.preventDefault();
        if (!e.ctrlKey) return;
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
    window.addEventListener('touchmove', onMove, {
        passive: false
    });
    window.addEventListener('touchend', onEnd);
    btnSettings.addEventListener('click', () => openPopup(settingsModal));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
    settingsModal.addEventListener('click', e => {
        if (e.target === settingsModal) settingsModal.classList.remove('open');
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
        if (shapeManager) shapeManager.recalculateGlobalDuration();
    });
    document.getElementById('animInterpolate').addEventListener('change', e => window.animationState.settings.interpolate = e.target.checked);
    document.getElementById("removeFillImage").onclick = () => {
        if (!shapeManager.selectedShape) return;
        shapeManager.selectedShape.bgImage = null;
        shapeManager.selectedShape.bgImageObj = null;
        shapeManager.redraw();
    };
    btnPlay.addEventListener('click', () => {
        if (window.animationState.isPlaying) return;
        if (window.animationState.duration === 0) {
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
        if (e.target === shapeModal) shapeModal.classList.remove('open');
    });
    shapeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const x = canvas.width / 2,
                y = canvas.height / 2;
            const s = new Shape(opt.dataset.shape, x, y, 100);
            s.selected = true;
            if (selectedShape) selectedShape.selected = false;
            selectedShape = s;
            if (opt.dataset.shape === 'path') {
                penMode = true;
            } else {
                penMode = false;
            }
            if (window.undoManager) {
                window.undoManager.execute(new ObjectLifecycleCommand(
                    shapes, s, 'add', shapes.length, () => {
                        if (shapeManager) shapeManager.setSelectedShape(s);
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
        showPrompt("Enter text:", "Hello World", (text) => {
            if (!text) return;

            const s = new Shape('text', canvas.width / 2, canvas.height / 2, 100);
            s.text = text;
            s.selected = true;
            if (selectedShape) selectedShape.selected = false;
            selectedShape = s;

            window.undoManager.execute(
                new ObjectLifecycleCommand(
                    shapes,
                    s,
                    'add',
                    shapes.length,
                    () => {
                        if (shapeManager) shapeManager.setSelectedShape(s);
                        drawAll();
                    }
                )
            );
        });
    });
    btnAddImage.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const s = new Shape('image', canvas.width / 2, canvas.height / 2, 150);
                    s.imageObj = img;
                    s.selected = true;
                    if (selectedShape) selectedShape.selected = false;
                    selectedShape = s;
                    window.undoManager.execute(
                        new ObjectLifecycleCommand(
                            shapes,
                            s,
                            'add',
                            shapes.length,
                            () => {
                                if (shapeManager) shapeManager.setSelectedShape(s);
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
    if (btnExportVideo) {
        btnExportVideo.addEventListener('click', async () => {
            if(window.animationState.duration === 0) {
                showToast("Add keyframes first!", 'I');
                return;
            }
            
            showConfirmDialog(
                "Export Video",
                `Export video? This will play the animation from start to finish (${window.animationState.duration.toFixed(1)}s).`,
                async () => {
                    exportStatus.style.display = 'block';
                    exportStatus.textContent = "Preparing recording...";
                    btnExportVideo.disabled = true;
                    
                    const exportCanvas = document.createElement('canvas');
                    exportCanvas.width = canvas.width;
                    exportCanvas.height = canvas.height;
                    const exportCtx = exportCanvas.getContext('2d');
                    
                    const stream = exportCanvas.captureStream(60);
                    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ?
                        "video/webm;codecs=vp9" :
                        "video/webm";
                    
                    mediaRecorder = new MediaRecorder(stream, {
                        mimeType: mimeType,
                        videoBitsPerSecond: 8000000
                    });
                    
                    recordedChunks = [];
                    mediaRecorder.ondataavailable = (event) => {
                        if(event.data.size > 0) {
                            recordedChunks.push(event.data);
                        }
                    };
                    
                    const originalTime = window.animationState.currentTime;
                    const wasPlaying = window.animationState.isPlaying;
                    window.animationState.isPlaying = false;
                    
                    const originalSelectedShapes = [...selectedShapes];
                    const originalSelectedShape = selectedShape;
                    
                    for(let shape of shapes) {
                        shape.selected = false;
                    }
                    selectedShapes = [];
                    selectedShape = null;
                    drawAll();
                    
                    await new Promise(r => setTimeout(r, 100));
                    
                    mediaRecorder.start();
                    
                    const duration = window.animationState.duration;
                    const fps = 60;
                    const totalFrames = Math.ceil(duration * fps);
                    let currentFrame = 0;
                    
                    exportStatus.textContent = "Rendering frames...";
                    
                    const renderFrame = () => {
                        if(currentFrame >= totalFrames) {
                            setTimeout(() => {
                                if(mediaRecorder.state === 'recording') {
                                    mediaRecorder.stop();
                                }
                            }, 100);
                            
                            window.seekAnimation(originalTime);
                            window.animationState.isPlaying = wasPlaying;
                            
                            for(let shape of shapes) {
                                shape.selected = false;
                            }
                            for(let shape of originalSelectedShapes) {
                                shape.selected = true;
                            }
                            selectedShapes = originalSelectedShapes;
                            selectedShape = originalSelectedShape;
                            if(shapeManager) shapeManager.setSelectedShape(selectedShape);
                            drawAll();
                            
                            exportStatus.textContent = "Finalizing...";
                            return;
                        }
                        
                        const time = currentFrame / fps;
                        window.seekAnimation(Math.min(time, duration));
                        
                        exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
                        
                        if(!window.animationState.settings.transparent) {
                            exportCtx.fillStyle = window.animationState.settings.bgColor;
                            exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                        }
                        
                        for(let shape of shapes) {
                            shape.draw(exportCtx);
                        }
                        
                        currentFrame++;
                        exportStatus.textContent = `Rendering frame ${currentFrame}/${totalFrames}`;
                        
                        requestAnimationFrame(renderFrame);
                    };
                    
                    setTimeout(() => {
                        renderFrame();
                    }, 100);
                    
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(recordedChunks, { type: "video/webm" });
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
                        showToast("Video exported successfully!", 'S');
                    };
                },
                () => {
                    showToast("Export cancelled", 'I');
                }
            );
        });
    }
    if (btnOpenEditModal) {
        btnOpenEditModal.addEventListener('click', () => {
            shapeManager.openEditModal();
        });
    }
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            shapeManager.exitEditMode();
            interpolateAndDraw();
        });
    }
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (window.undoManager.undo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (window.undoManager.redo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        }
    });

    function updateUndoRedoButtons() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');
        if (!window.undoManager) return;
        const info = window.undoManager.getStackInfo();
        if (btnUndo) btnUndo.disabled = info.undo === 0;
        if (btnRedo) btnRedo.disabled = info.redo === 0;
    }
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            if (window.undoManager.undo()) {
                updateUndoRedoButtons();
                drawAll();
            }
        });
    }
    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            if (window.undoManager.redo()) {
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

        if (x > wrapperWidth / 2) {
            timelineTracksWrapper.scrollLeft = x - wrapperWidth / 2;
        }

        if (autoExtendEnabled) {
            const scrollLeft = timelineTracksWrapper.scrollLeft;
            const scrollWidth = timelineTracksWrapper.scrollWidth;
            const clientWidth = timelineTracksWrapper.clientWidth;

            if (scrollLeft + clientWidth >= scrollWidth - autoExtendThreshold) {
                extendTimeline();
            }
        }
    }

    function startTimelineDrag(e) {
        if (e.ctrlKey) {
            timelineDragging = true;
            timelineDragStartX = e.touches ? e.touches[0].clientX : e.clientX;
            timelineScrollStart = timelineTracksWrapper.scrollLeft;
            timelineTracksWrapper.style.cursor = "grabbing";
            timelineRuler.style.cursor = "grabbing";
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function moveTimelineDrag(e) {
        if (!timelineDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = clientX - timelineDragStartX;
        const newScrollLeft = timelineScrollStart - dx;

        timelineTracksWrapper.scrollLeft = newScrollLeft;
        timelineRuler.scrollLeft = newScrollLeft;

        e.preventDefault();
        e.stopPropagation();
    }

    function endTimelineDrag() {
        timelineDragging = false;
        timelineTracksWrapper.style.cursor = "default";
        timelineRuler.style.cursor = "pointer";
    }
    resizeHandle.addEventListener("mousedown", (e) => {
        timelineResizing = true;
        startY = e.clientY;
        startHeight = timelineContainer.offsetHeight;
        document.body.style.cursor = "ns-resize";
    });
    document.addEventListener("mousemove", (e) => {
        if (!timelineResizing) return;
        const dy = startY - e.clientY;
        let newHeight = startHeight + dy;
        newHeight = Math.max(40, newHeight);
        newHeight = Math.min(window.innerHeight * 0.6, newHeight);
        playerTime.style.bottom = (newHeight + 5) + "px";
        timelineContainer.style.height = newHeight + "px";
        fitCanvasToScreen();
    });
    document.addEventListener("mouseup", () => {
        timelineResizing = false;
        document.body.style.cursor = "default";
    });
    resizeHandle.addEventListener("touchstart", (e) => {
        timelineResizing = true;
        startY = e.touches[0].clientY;
        startHeight = timelineContainer.offsetHeight;
    });
    document.addEventListener("touchmove", (e) => {
        if (!timelineResizing) return;
        const dy = startY - e.touches[0].clientY;
        const newHeight = Math.max(120, startHeight + dy);
        playerTime.style.bottom = (newHeight + 5) + "px";
        timelineContainer.style.height = newHeight + "px";
        updatePlayhead();
        fitCanvasToScreen();
    });
    document.addEventListener("touchend", () => {
        timelineResizing = false;
    });

    function showToast(message, type, duration = 3000) {
        let toastBgColor = '#111111';
        let toastColor = '#eeeeee';
        if (type === 'S') {
            toastBgColor = '#2eb82e';
        } else if (type === 'E') {
            toastBgColor = '#ff5c33';
        } else if (type === 'I') {
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
        const duration = window.animationState.animationDuration || 60;
        const minWidth = Math.max(duration * pixelsPerSecond + 200, 60 * pixelsPerSecond + 200);
        const timelineWidth = Math.max(minWidth, timelineTracksWrapper.clientWidth + 100);
        timelineTracks.style.width = timelineWidth + "px";
        timelineRuler.width = timelineWidth;
        timelineRuler.style.width = timelineWidth + "px";
        drawTimelineRuler();
    }

    timelineTracksWrapper.addEventListener("mousedown", startTimelineDrag);
    rulerCntainer.addEventListener("mousedown", startTimelineDrag);
    timelineTracksWrapper.addEventListener("touchstart", startTimelineDrag, {
        passive: false
    });
    rulerCntainer.addEventListener("touchstart", startTimelineDrag, {
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
        rulerCntainer.style.transform = scrollX; //`translateX(${-scrollX}px)`;
        trackLabels.scrollTop = timelineTracksWrapper.scrollTop;
        drawTimelineRuler();
    });
    trackLabels.addEventListener("scroll", () => {
        timelineTracksWrapper.scrollTop = trackLabels.scrollTop;
    });
    
    function zoomTimeline(deltaY, mouseX) {
        const scrollLeft = timelineTracksWrapper.scrollLeft;
        const rulerRect = timelineRuler.getBoundingClientRect();
        const mouseTimelineX = mouseX - rulerRect.left + scrollLeft;
        const mouseTime = mouseTimelineX / pixelsPerSecond;
        
        let newZoom = timelineZoomLevel;
        if (deltaY < 0) {
            newZoom = Math.min(MAX_ZOOM, timelineZoomLevel + ZOOM_STEP);
        } else {
            newZoom = Math.max(MIN_ZOOM, timelineZoomLevel - ZOOM_STEP);
        }
        
        if (newZoom === timelineZoomLevel) return;
        
        timelineZoomLevel = newZoom;
        pixelsPerSecond = 100 * timelineZoomLevel;
        
        const newMouseTimelineX = mouseTime * pixelsPerSecond;
        const newScrollLeft = Math.max(0, newMouseTimelineX - (mouseTimelineX - scrollLeft));
        
        const duration = window.animationState.animationDuration || 60;
        timelineTracks.style.width = (duration * pixelsPerSecond + 200) + "px";
        
        document.querySelectorAll('.keyframe').forEach(kf => {
            const time = parseFloat(kf.getAttribute('data-time'));
            if (time) kf.style.left = (time * pixelsPerSecond) + "px";
        });
        
        timelineTracksWrapper.scrollLeft = newScrollLeft;
        drawTimelineRuler();
    }
    
    timelineContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            zoomTimeline(e.deltaY, e.clientX);
        }
    }, { passive: false });
    
    timelineRuler.addEventListener('dblclick', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            pixelsPerSecond = 100;
            timelineZoomLevel = 1;
            updateTimelineSize();
            drawTimelineRuler();
        }
    });
    
    function updateTrackRowWidths() {
        const duration = window.animationState.duration || 60;
        const timelineWidth = Math.max(duration * pixelsPerSecond + 200, timelineTracksWrapper.clientWidth + 100);
        const trackRows = document.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            row.style.width = timelineWidth + "px";
        });
    }
    
    function afterZoom() {
        updateTrackRowWidths();
        rebuildTracks();
        drawTimelineRuler();
    }

    function updateTimelineSize() {
        const duration = window.animationState.animationDuration || 60;
        const timelineWidth = Math.max(duration * pixelsPerSecond + 200, timelineTracksWrapper.clientWidth + 100);
        
        timelineTracks.style.width = timelineWidth + "px";
        timelineRuler.width = timelineWidth;
        timelineRuler.style.width = timelineWidth + "px";
        
        const trackRows = timelineTracks.querySelectorAll('.track-row');
        trackRows.forEach(row => {
            row.style.width = timelineWidth + "px";
        });
        
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
        if (selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
            if (penMode) {
                canvas.style.cursor = "crosshair";
            } else {
                canvas.style.cursor = "default";
            }
        } else {
            if (viewport.mode === 'canvas') {
                canvas.style.cursor = viewport.panning ? 'grabbing' : 'grab';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    }

    function groupSelected() {
        if (selectedShapes.length < 2) {
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
        const oldShapesState = shapesToGroup.map(shape => ({
            shape: shape,
            x: shape.x,
            y: shape.y,
            index: shapes.indexOf(shape)
        }));
        clearSelection();
        shapesToGroup.forEach(shape => {
            shape._originalWorldX = shape.x;
            shape._originalWorldY = shape.y;
            shape.x = shape.x - centerX;
            shape.y = shape.y - centerY;
            const index = shapes.indexOf(shape);
            if (index !== -1) shapes.splice(index, 1);
            group.children.push(shape);
        });
        shapes.push(group);
        selectShape(group);
        rebuildTracks();
        drawAll();

        if (window.undoManager) {
            const groupCommand = {
                execute: () => {},
                undo: () => {
                    const groupIdx = shapes.indexOf(group);
                    if (groupIdx !== -1) shapes.splice(groupIdx, 1);

                    oldShapesState.forEach(state => {
                        state.shape.x = state.x;
                        state.shape.y = state.y;
                        state.shape.parentGroup = null;
                        shapes.splice(state.index, 0, state.shape);
                    });

                    clearSelection();
                    oldShapesState.forEach(state => {
                        state.shape.selected = true;
                        selectedShapes.push(state.shape);
                    });
                    if (oldShapesState.length > 0) {
                        selectedShape = oldShapesState[0].shape;
                        if (shapeManager) shapeManager.setSelectedShape(selectedShape);
                    }
                    rebuildTracks();
                    drawAll();
                }
            };
            window.undoManager.execute(groupCommand);
        }
    }

    function ungroupSelected() {
        if (selectedShapes.length !== 1 || selectedShapes[0].type !== "group") {
            showToast("Select a single group to ungroup", 'I');
            return;
        }
        const group = selectedShapes[0];
        const index = shapes.indexOf(group);
        const childrenState = group.children.map(child => ({
            child: child,
            x: child.x + group.x,
            y: child.y + group.y,
            parentGroup: child.parentGroup
        }));
        if (index !== -1) shapes.splice(index, 1);
        group.children.forEach(child => {
            child.x = child._originalWorldX || (child.x + group.x);
            child.y = child._originalWorldY || (child.y + group.y);
            shapes.push(child);
        });
        clearSelection();
        rebuildTracks();
        drawAll();

        if (window.undoManager) {
            const ungroupCommand = {
                execute: () => {},
                undo: () => {
                    childrenState.forEach(state => {
                        const idx = shapes.indexOf(state.child);
                        if (idx !== -1) shapes.splice(idx, 1);
                    });

                    group.children = childrenState.map(state => state.child);
                    group.children.forEach((child, i) => {
                        child.x = childrenState[i].x - group.x;
                        child.y = childrenState[i].y - group.y;
                        child.parentGroup = group;
                    });
                    shapes.splice(index, 0, group);
                    selectShape(group);
                    rebuildTracks();
                    drawAll();
                }
            };
            window.undoManager.execute(ungroupCommand);
        }
    }

    if (window.updateTimelineSize) {
        window.updateTimelineSize();
    }

    function updateSoloModeStatus() {
        const statusDiv = document.getElementById('soloModeStatus');
        const soloNameSpan = document.getElementById('soloObjectName');
        if (soloEditMode && soloEditObject) {
            statusDiv.style.display = 'block';
            soloNameSpan.textContent = getObjectName(soloEditObject);
        } else {
            statusDiv.style.display = 'none';
        }
    }

    const exitSoloMode = document.getElementById('exitSoloMode');
    if (exitSoloMode) {
        exitSoloMode.addEventListener('click', () => {
            soloEditMode = false;
            soloEditObject = null;
            rebuildTracks();
            drawAll();
            updateSoloModeStatus();
            showToast("Solo mode exited - All objects editable", 'I');
        });
    }

    function activateSelectionTool() {
        if (typeof setDrawingTool === 'function') {
            finishDrawing();
            cancelDrawing();
            setDrawingTool(null);
        }

        if (typeof setFillBucketTool === 'function') {
            setFillBucketTool(false);
        }
        penMode = false;
        isEditingPolyline = false;
        isEditingPoint = false;

        canvas.style.cursor = 'default';

        selectionToolActive = true;

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

        const brushTypeSelector = document.getElementById('brushTypeSelector');
        if (brushTypeSelector) brushTypeSelector.style.display = 'none';
    }

    function deactivateSelectionTool() {
        selectionToolActive = false;
        const btnSelectionTool = document.getElementById('btnSelectionTool');
        if (btnSelectionTool) btnSelectionTool.classList.remove('mode-active');
    }

    const originalSetMode = setMode;
    setMode = function(mode) {
        if (mode === 'object') {
            activateSelectionTool();
        } else if (mode === 'canvas') {
            deactivateSelectionTool();
        }
        if (originalSetMode) originalSetMode(mode);
    };

    const btnSelectionTool = document.getElementById('btnSelectionTool');
    if (btnSelectionTool) {
        btnSelectionTool.addEventListener('click', () => {
            if (selectionToolActive) {
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
        if (fileInput) {
            fileInput.click();
        }
    }

    function loadProjectFromJSON(jsonData, skipConfirm = false) {
        const hasExistingWork = shapes.length > 0;
        if (hasExistingWork && !skipConfirm) {
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
            
            function loadImageFromBase64(base64Data) {
                return new Promise((resolve) => {
                    if (!base64Data) {
                        resolve(null);
                        return;
                    }
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = base64Data;
                });
            }
            
            async function processShape(shapeData) {
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
                    if(shapeData.customName) newShape.customName = shapeData.customName;
                    
                    if(shapeData.children) {
                        for(let childData of shapeData.children) {
                            const child = await processShape(childData);
                            if(child) {
                                child.parentGroup = newShape;
                                newShape.children.push(child);
                            }
                        }
                    }
                } 
                else if(shapeData.type === 'drawing') {
                    newShape = new Shape('drawing', shapeData.x, shapeData.y, shapeData.size);
                    newShape.strokesData = shapeData.strokesData || [];
                    newShape.fillColor = shapeData.fillColor || [];
                    newShape.isDrawing = true;
                    newShape.finished = true;
                    newShape.editable = false;
                    if(shapeData.customName) newShape.customName = shapeData.customName;
                }
                else {
                    newShape = recreateShape(shapeData);
                    if(shapeData.customName) newShape.customName = shapeData.customName;
                }
                
                if(shapeData.imageData) {
                    const img = await loadImageFromBase64(shapeData.imageData);
                    if(img) newShape.imageObj = img;
                }
                
                if(shapeData.bgImageData) {
                    const img = await loadImageFromBase64(shapeData.bgImageData);
                    if(img) newShape.bgImageObj = img;
                }
                
                if(shapeData.keyframes && shapeData.keyframes.length > 0) {
                    newShape.keyframes = shapeData.keyframes;
                }
                
                return newShape;
            }
            
            async function loadAllShapes() {
                const loadedShapes = [];
                for(let shapeData of data.shapes) {
                    const shape = await processShape(shapeData);
                    if(shape) loadedShapes.push(shape);
                }
                return loadedShapes;
            }
            
            loadAllShapes().then(async (loadedShapes) => {
                shapes = loadedShapes;
                
                window.animationState.settings = data.settings;
                
                let maxTime = 0;
                for(let shape of shapes) {
                    for(let kf of shape.keyframes) {
                        if(kf.time > maxTime) {
                            maxTime = kf.time;
                        }
                    }
                }
                window.animationState.duration = Math.max(60, maxTime + (1 / window.animationState.fps));
                
                if(typeof updateGlobalDuration === 'function') {
                    updateGlobalDuration(window.animationState.duration);
                }
                
                if(shapeManager && typeof shapeManager.buildTrack === 'function') {
                    for(let shape of shapes) {
                        shapeManager.buildTrack(shape);
                    }
                    shapeManager.shapes = shapes;
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
                            if(shapeManager) shapeManager.shapes = shapes;
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
            }).catch(error => {
                console.error("Import error:", error);
                showToast("Failed to load project: " + error.message, 'E');
            });
            
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
        for (let prop of props) {
            if (shapeData[prop] !== undefined) {
                shape[prop] = shapeData[prop];
            }
        }
        if (shapeData.points) {
            shape.points = JSON.parse(JSON.stringify(shapeData.points));
        }
        if (shapeData.segments) {
            shape.segments = JSON.parse(JSON.stringify(shapeData.segments));
        }
        if (shapeData.keyframes && shapeData.keyframes.length > 0) {
            shape.keyframes = JSON.parse(JSON.stringify(shapeData.keyframes));
        } else {
            shape.keyframes = [];
        }
        if (shapeData.bgImage) {
            shape.bgImage = shapeData.bgImage;
            const img = new Image();
            img.src = shapeData.bgImage;
            shape.bgImageObj = img;
        }
        if (shapeData.imageObj && shapeData.imageObj.src) {
            const img = new Image();
            img.src = shapeData.imageObj.src;
            shape.imageObj = img;
        }
        return shape;
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;
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
        for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            console.log(`Shape ${i+1} (${shape.type}): ${shape.keyframes.length} keyframes`);
            if (shape.keyframes.length > 0) {
                console.log("  Keyframes:", shape.keyframes.map(kf => kf.time.toFixed(2)).join(", "));
            }
        }
        if (window.animationState.duration === 0) {
            console.warn("WARNING: Duration is 0! No keyframes found or duration not calculated.");
        }
    }
    document.getElementById('btnImportProject') ?.addEventListener('click', importProject);
    document.getElementById('importFileInput') ?.addEventListener('change', handleImportFile);

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
            if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (shapes.length > 0) {
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

        drawAll();
    }

    function initTimelineAutoExtend() {
        timelineTracksWrapper.addEventListener('scroll', () => {
            if (!autoExtendEnabled) return;

            const scrollLeft = timelineTracksWrapper.scrollLeft;
            const scrollWidth = timelineTracksWrapper.scrollWidth;
            const clientWidth = timelineTracksWrapper.clientWidth;

            if (scrollLeft + clientWidth >= scrollWidth - autoExtendThreshold) {
                extendTimeline();
            }
        });
    }

    function extendTimeline() {
        const currentDuration = window.animationState.duration;
        const newDuration = currentDuration + 60;

        window.animationState.duration = newDuration;

        updateTimelineSize();
        drawTimelineRuler();
        updateTimelineUI();
        updateAllKeyframePositions();

        if (loopEnabled) {
            loopEndTime = newDuration;
            drawTimelineRuler();
        }

        if (!window._extendingTimeline) {
            window._extendingTimeline = true;
            setTimeout(() => {
                window._extendingTimeline = false;
            }, 1000);
        }
    }

    const btnAutoExtend = document.getElementById('btnAutoExtend');
    if (btnAutoExtend) {
        btnAutoExtend.addEventListener('click', () => {
            autoExtendEnabled = !autoExtendEnabled;
            if (autoExtendEnabled) {
                btnAutoExtend.classList.add('mode-active');
                btnAutoExtend.style.color = 'var(--accent)';
            } else {
                btnAutoExtend.classList.remove('mode-active');
                btnAutoExtend.style.color = '';
            }
        });

        if (autoExtendEnabled) {
            btnAutoExtend.classList.add('mode-active');
            btnAutoExtend.style.color = 'var(--accent)';
        }
    }
    
    function initMobileSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const operationsSection = document.querySelector('.operations-section');
        const animationSection = document.querySelector('.animation-section');
        
        if (!sidebarToggle || !operationsSection) return;
        
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        function closeSidebar() {
            operationsSection.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function openSidebar() {
            operationsSection.classList.add('sidebar-open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function toggleSidebar() {
            if (operationsSection.classList.contains('sidebar-open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
        
        sidebarToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && operationsSection.classList.contains('sidebar-open')) {
                closeSidebar();
            }
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
                operationsSection.style.right = '';
            }
        });
    }

    window.addEventListener('DOMContentLoaded', () => {
        const btnPencil = document.getElementById('btnPencil');
        const btnBrush = document.getElementById('btnBrush');
        const btnEraser = document.getElementById('btnEraser');
        const btnFinishDrawing = document.getElementById('btnFinishDrawing');
        const btnCancelDrawing = document.getElementById('btnCancelDrawing');
        const strokeColorPicker = document.getElementById('strokeColorPicker');
        const easingSelect = document.getElementById('easingSelect');
        btnModeObject.addEventListener('click', () => setMode('object'));
        btnModeCanvas.addEventListener('click', () => setMode('canvas'));
        playerTime.style.bottom = '185px';
        timelineContainer.style.height = '180px';
        initCanvas();
        shapeManager = new ShapeManager(shapes, drawAll, () => window.animationState.settings, updateGlobalDuration);
        
        if (typeof initAllShapesAttachPoints === 'function') {
            initAllShapesAttachPoints();
        }
        drawTimelineRuler();
        rebuildTracks();
        updateTimelineUI();
        updateUndoRedoButtons();
        updateTimelineSize();
        initTimelineRulerEvents();
        setMode('object');
        window.Shape = Shape;
        initFillBucketTool();
        initDrawingCanvas();
        updateSoloModeStatus();
        initTimelineAutoExtend();
        initTimelineHover();
        initMobileSidebar();
        const btnGroup = document.getElementById('btnGroup');
        const btnUngroup = document.getElementById('btnUngroup');
        if (btnGroup) {
            btnGroup.addEventListener('click', groupSelected);
        }
        if (btnUngroup) {
            btnUngroup.addEventListener('click', ungroupSelected);
        }
        if (btnPencil) {
            btnPencil.addEventListener('click', () => setDrawingTool('pencil'));
        }
        if (btnBrush) {
            btnBrush.addEventListener('click', () => setDrawingTool('brush'));
        }
        if (btnEraser) {
            btnEraser.addEventListener('click', () => setDrawingTool('eraser'));
        }
        if (btnFinishDrawing) {
            btnFinishDrawing.addEventListener('click', () => {
                finishDrawing();
            });
        }
        if (btnCancelDrawing) {
            btnCancelDrawing.addEventListener('click', () => {
                cancelDrawing();
                setDrawingTool(null);
            });
        }
        if (strokeColorPicker) {
            strokeColorPicker.addEventListener('change', (e) => updateStrokeColor(e.target.value));
        }
        const strokeWidthContainer = document.getElementById('strokeWidthContainer');
        if (strokeWidthContainer) {
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
        if (strokeOpacityContainer) {
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
        if (eraserSizeContainer) {
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
                    if (typeof updateEraserSize === 'function') updateEraserSize(v);
                }
            });
            eraserSizeContainer.appendChild(eraserSizeSlider);
        }
        if (easingSelect) {
            easingSelect.addEventListener('change', (e) => {
                window.animationState.settings.easing = e.target.value;
                shapes.forEach(shape => shapeManager.buildTrack(shape));
                drawAll();
            });
        }
        const brushSpacingContainer = document.getElementById('brushSpacingContainer');
        if (brushSpacingContainer) {
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
        if (glowIntensityContainer) {
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
        document.getElementById('minTaperWidthSlider') ?.appendChild(minTaperWidthSlider);
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
        document.getElementById('maxTaperWidthSlider') ?.appendChild(maxTaperWidthSlider);
        const stabilizationSlider = document.getElementById('stabilizationSlider');
        if (stabilizationSlider) {
            stabilizationSlider.addEventListener('input', (e) => {
                setStabilizationLevel(e.target.value);
            });
        }
        const stabilizationSliderContainer = document.getElementById('stabilizationSliderContainer');
        if (stabilizationSliderContainer) {
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
                    if (typeof setStabilizationLevel === 'function') {
                        setStabilizationLevel(v);
                    }
                }
            });
            stabilizationSliderContainer.appendChild(stabilizationSlider);
        }
        const smoothingSelect = document.getElementById('smoothingSelect');
        if (smoothingSelect) {
            smoothingSelect.addEventListener('change', (e) => {
                setSmoothingAlgorithm(e.target.value);
            });
        }
        initDragAndDropImport();

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

        const btnWebsite = document.getElementById('btnWebsite');
        const btnReportIssue = document.getElementById('btnReportIssue');

        if (btnWebsite) {
            btnWebsite.addEventListener('click', () => {
                window.open('https://rnstudio.phavio.com', '_blank');
            });
        }

        if (btnReportIssue) {
            btnReportIssue.addEventListener('click', () => {
                window.open('https://github.com/MRaheem99/mr-studio/issues', '_blank');
            });
        }

        const strokeHardnessContainer = document.getElementById('strokeHardnessContainer');
        if (strokeHardnessContainer) {
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
                    if (typeof updateStrokeHardness === 'function') updateStrokeHardness(v);
                }
            });
            strokeHardnessContainer.appendChild(hardnessSlider);
        }

        const eraserHardnessContainer = document.getElementById('eraserHardnessContainer');
        if (eraserHardnessContainer) {
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
                    if (typeof updateEraserHardness === 'function') updateEraserHardness(v);
                }
            });
            eraserHardnessContainer.appendChild(eraserHardnessSlider);
        }

        const fontSelect = document.getElementById('fontFamilySelect');
        if (fontSelect && typeof FONT_LIST !== 'undefined') {
            fontSelect.innerHTML = '';

            const systemGroup = document.createElement('optgroup');
            systemGroup.label = 'System Fonts (Web Safe)';

            const googleGroup = document.createElement('optgroup');
            googleGroup.label = 'Google Fonts';

            FONT_LIST.forEach(font => {
                const option = document.createElement('option');
                option.value = font.value;
                option.textContent = font.display;

                if (font.category === 'system') {
                    systemGroup.appendChild(option);
                } else {
                    googleGroup.appendChild(option);
                }
            });

            fontSelect.appendChild(systemGroup);
            fontSelect.appendChild(googleGroup);
        }
        
        canvas.addEventListener('touchstart', (e) => {
            if (viewport.mode !== 'canvas') return;
            
            if (e.touches.length === 2) {
                e.preventDefault();
                isPinching = true;
                
                const rect = canvas.getBoundingClientRect();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                initialViewportPointX = viewport.pointX;
                initialViewportPointY = viewport.pointY;
                initialPinchPointX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
                initialPinchPointY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
                
                initialPinchDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                initialPinchScale = viewport.scale;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            if (viewport.mode !== 'canvas') return;
            
            if (e.touches.length === 2 && isPinching && initialPinchDistance > 0) {
                e.preventDefault();
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const currentDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                
                const scaleChange = currentDistance / initialPinchDistance;
                let newScale = initialPinchScale * scaleChange;
                newScale = Math.min(5, Math.max(0.1, newScale));
                
                const worldX = (initialPinchPointX - initialViewportPointX) / viewport.scale;
                const worldY = (initialPinchPointY - initialViewportPointY) / viewport.scale;
                
                viewport.scale = newScale;
                
                viewport.pointX = initialPinchPointX - worldX * viewport.scale;
                viewport.pointY = initialPinchPointY - worldY * viewport.scale;
                
                canvas.style.transform = `translate(${viewport.pointX}px, ${viewport.pointY}px) scale(${viewport.scale})`;
                canvas.style.transformOrigin = "top left";
                
                if (drawingCanvas) {
                    drawingCanvas.style.transform = canvas.style.transform;
                    drawingCanvas.style.transformOrigin = canvas.style.transformOrigin;
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            if (viewport.mode !== 'canvas') return;
            
            if (e.touches.length < 2) {
                isPinching = false;
                initialPinchDistance = 0;
            }
        });
        
        canvas.addEventListener('touchstart', (e) => {
            if (viewport.mode !== 'canvas') return;
            if (e.touches.length === 1 && !isPinching) {
                e.preventDefault();
                isTouchPanning = true;
                touchPanStartX = e.touches[0].clientX;
                touchPanStartY = e.touches[0].clientY;
                touchPanStartPointX = viewport.pointX;
                touchPanStartPointY = viewport.pointY;
                canvas.style.cursor = 'grabbing';
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            if (viewport.mode !== 'canvas') return;
            
            if (e.touches.length === 1 && isTouchPanning && !isPinching) {
                e.preventDefault();
                
                const deltaX = e.touches[0].clientX - touchPanStartX;
                const deltaY = e.touches[0].clientY - touchPanStartY;
                
                viewport.pointX = touchPanStartPointX + deltaX;
                viewport.pointY = touchPanStartPointY + deltaY;
                
                canvas.style.transform = `translate(${viewport.pointX}px, ${viewport.pointY}px) scale(${viewport.scale})`;
                canvas.style.transformOrigin = "top left";
                
                if (drawingCanvas) {
                    drawingCanvas.style.transform = canvas.style.transform;
                    drawingCanvas.style.transformOrigin = canvas.style.transformOrigin;
                }
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            if (viewport.mode !== 'canvas') return;
            isTouchPanning = false;
            canvas.style.cursor = 'grab';
        });

    });
