function resetAnimationState() {
    window.animationState.isPlaying = false;
    cancelAnimationFrame(animationFrameId);
    window.animationState.currentTime = 0;
    updateTimelineUI();
    interpolateAndDraw();
    updatePlayhead();
    if(timelineTracksWrapper) {
        timelineTracksWrapper.scrollLeft = 0;
    }
}

function animate(timestamp) {
    if(!window.animationState.isPlaying) return;
    const deltaTime = (timestamp - window.animationState.lastFrameTime) / 1000;
    window.animationState.lastFrameTime = timestamp;
    window.animationState.currentTime += deltaTime;
    if(window.animationState.currentTime >= window.animationState.duration) {
        resetAnimationState();
        return;
    }
    updateTimelineUI();
    interpolateAndDraw();
    animationFrameId = requestAnimationFrame(animate);
}

function getEasingFunction(easingType, t) {
    switch(easingType) {
        case 'linear':
            return t;
        case 'easeInQuad':
            return t * t;
        case 'easeOutQuad':
            return t * (2 - t);
        case 'easeInOutQuad':
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        case 'easeInCubic':
            return t * t * t;
        case 'easeOutCubic':
            return (--t) * t * t + 1;
        case 'easeInOutCubic':
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        case 'easeInBack':
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return c3 * t * t * t - c1 * t * t;
        case 'easeOutBack':
            const c1b = 1.70158;
            const c3b = c1b + 1;
            return 1 + c3b * Math.pow(t - 1, 3) + c1b * Math.pow(t - 1, 2);
        case 'easeInOutBack':
            const c1c = 1.70158;
            const c2 = c1c * 1.525;
            return t < 0.5 ?
                (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 :
                (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        case 'bounce':
            if(t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if(t < 2 / 2.75) {
                t -= 1.5 / 2.75;
                return 7.5625 * t * t + 0.75;
            } else if(t < 2.5 / 2.75) {
                t -= 2.25 / 2.75;
                return 7.5625 * t * t + 0.9375;
            } else {
                t -= 2.625 / 2.75;
                return 7.5625 * t * t + 0.984375;
            }
        case 'elastic':
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        default:
            return t;
    }
}

function interpolateAndDraw_L() {
    const time = window.animationState.currentTime;
    if(time === lastDrawTime) return;
    lastDrawTime = time;
    const fps = window.animationState.fps;
    const frame = Math.floor(window.animationState.currentTime * fps);
    for(let shape of shapes) {
        if(!shape.track) {
            drawAll();
            continue;
        }
        const state = shape.track[frame];
        if(state) {
            shapeManager.applyState(shape, state);
        }
        updatePlayhead();
    }
    drawAll();
}

function interpolateAndDraw() {
    const time = window.animationState.currentTime;
    if(time === lastDrawTime) return;
    lastDrawTime = time;
    const fps = window.animationState.fps;
    const frame = Math.floor(window.animationState.currentTime * fps);
    const allShapes = [];
    
    
    // First, apply states to ALL shapes (including groups)
    for (let shape of shapes) {
        if (shape.track && shape.track[frame]) {
            shapeManager.applyState(shape, shape.track[frame]);
        }
    }

    function collectShapes(obj) {
        if(obj.type === "group") {
            obj.children.forEach(child => collectShapes(child));
        } else {
            allShapes.push(obj);
        }
    }
    shapes.forEach(shape => collectShapes(shape));
    for(let shape of allShapes) {
        if(!shape.track) {
            drawAll();
            continue;
        }
        const state = shape.track[frame];
        if(state) {
            shapeManager.applyState(shape, state);
        }
        updatePlayhead();
    }
    drawAll();
}

function lerpState(start, end, t) {
    const state = {};
    for(const key in start) {
        if(typeof start[key] === 'number' && typeof end[key] === 'number') {
            state[key] = start[key] + (end[key] - start[key]) * t;
        } else {
            state[key] = start[key];
        }
    }
    return state;
}

function drawAll() {
    const s = window.animationState.settings;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(!s.transparent) {
        ctx.fillStyle = s.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    shapes.forEach(shape => shape.draw(ctx));
    rebuildTracks();
    updateEditModeIndicator();
}

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
        screenX: clientX,
        screenY: clientY
    };
}

function startMarquee(x, y, screenX, screenY) {
    const marquee = document.createElement('div');
    marquee.id = 'marqueeSelect';
    marquee.style.cssText = `
        position: fixed;
        border: 2px dashed #00d4ff;
        background: rgba(0, 212, 255, 0.1);
        pointer-events: none;
        z-index: 9999;
        left: ${screenX}px;
        top: ${screenY}px;
        width: 0px;
        height: 0px;
    `;
    document.body.appendChild(marquee);
    isMarqueeActive = true;
    marqueeStart = {
        x: x,
        y: y
    };
    marqueeStartScreen = {
        x: screenX,
        y: screenY
    };
}

function updateMarquee(screenX, screenY) {
    const marquee = document.getElementById('marqueeSelect');
    if(!marquee) return;
    const left = Math.min(marqueeStartScreen.x, screenX);
    const top = Math.min(marqueeStartScreen.y, screenY);
    const width = Math.abs(screenX - marqueeStartScreen.x);
    const height = Math.abs(screenY - marqueeStartScreen.y);
    marquee.style.left = left + 'px';
    marquee.style.top = top + 'px';
    marquee.style.width = width + 'px';
    marquee.style.height = height + 'px';
    marqueeEnd = {
        x: marqueeStart.x + (screenX - marqueeStartScreen.x) * (canvas.width / canvas.getBoundingClientRect().width),
        y: marqueeStart.y + (screenY - marqueeStartScreen.y) * (canvas.height / canvas.getBoundingClientRect().height)
    };
}

function endMarquee() {
    const marquee = document.getElementById('marqueeSelect');
    if(marquee) marquee.remove();
    if(!isMarqueeActive) return;
    isMarqueeActive = false;
    const left = Math.min(marqueeStart.x, marqueeEnd.x);
    const right = Math.max(marqueeStart.x, marqueeEnd.x);
    const top = Math.min(marqueeStart.y, marqueeEnd.y);
    const bottom = Math.max(marqueeStart.y, marqueeEnd.y);
    const shapesInMarquee = [];
    for(let shape of shapes) {
        const center = {
            x: shape.x,
            y: shape.y
        };
        if(center.x >= left && center.x <= right && center.y >= top && center.y <= bottom) {
            shapesInMarquee.push(shape);
        }
    }
    shapes.forEach(s => s.selected = false);
    selectedShapes = [];
    if(shapesInMarquee.length > 0) {
        shapesInMarquee.forEach(shape => {
            shape.selected = true;
            selectedShapes.push(shape);
        });
        selectedShape = shapesInMarquee[shapesInMarquee.length - 1];
        if(shapeManager) shapeManager.setSelectedShape(selectedShape);
        drawAll();
    }
}

function onStart(e) {
    if(isDrawing) return;
    if(e.ctrlKey){
        viewport.mode = 'canvas';
    }else{
        viewport.mode = 'object';
    }
    
    if (e.button === 2 && isEditingPolyline && selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
        e.preventDefault();
        const pos = getPos(e);
        const handle = selectedShape.getHandleAt(pos.x, pos.y);
        
        if(handle && handle.type === "poly-point") {
            if(selectedShape.points.length > 2) {
                const removedPoint = selectedShape.points[handle.index];
                
                if(window.undoManager) {
                    const undoCommand = {
                        execute: () => {
                            selectedShape.points.splice(handle.index, 1);
                            drawAll();
                        },
                        undo: () => {
                            selectedShape.points.splice(handle.index, 0, removedPoint);
                            drawAll();
                        }
                    };
                    window.undoManager.execute(undoCommand);
                } else {
                    selectedShape.points.splice(handle.index, 1);
                    drawAll();
                }
                showToast("Point removed", 'I');
            } else {
                showToast("Cannot remove last point", 'E');
            }
        } 
        else if(handle && handle.type === "path-handle") {
            const p = selectedShape.points[handle.index];
            const oldIn = { ...p.in };
            const oldOut = { ...p.out };
            
            if(window.undoManager) {
                const undoCommand = {
                    execute: () => {
                        p.in = { x: 0, y: 0 };
                        p.out = { x: 0, y: 0 };
                        p.curve = false;
                        drawAll();
                    },
                    undo: () => {
                        p.in = oldIn;
                        p.out = oldOut;
                        p.curve = true;
                        drawAll();
                    }
                };
                window.undoManager.execute(undoCommand);
            } else {
                p.in = { x: 0, y: 0 };
                p.out = { x: 0, y: 0 };
                p.curve = false;
                drawAll();
            }
            showToast("Curve removed", 'I');
        }
        else {
            penMode = false;
            isEditingPolyline = false;
            isEditingPoint = false;
            selectedShape.finished = true;
            selectedShape.editable = false;
            showToast("Edit finished!", 'S');
            drawAll();
        }
        return;
    }
    if(penMode && selectedShape && (selectedShape.type === "path" || selectedShape.type === "polyline")) {
        if(e.detail === 2) {
            penMode = false;
            isEditingPolyline = false;
            isEditingPoint = false;
            selectedShape.finished = true;
            selectedShape.editable = false;
            showToast("Edit finished! Shape now has transform handles", 'S');
            drawAll();
            return;
        }
    }
    if(viewport.mode === 'object' && e.shiftKey && !e.ctrlKey && !window.animationState.isPlaying) {
        const pos = getPos(e);
        startMarquee(pos.x, pos.y, e.clientX, e.clientY);
        e.preventDefault();
        return;
    }
    if(viewport.mode === 'canvas') {
        if(e.touches && e.touches.length === 2) {
            const rect = canvas.getBoundingClientRect();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
            const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const prevScale = viewport.scale;
            viewport.scale = Math.max(0.1, viewport.startScale + (dist - viewport.startDist) * 0.005);
            const scaleChange = viewport.scale / prevScale;
            viewport.pointX = centerX - (centerX - viewport.pointX) * scaleChange;
            viewport.pointY = centerY - (centerY - viewport.pointY) * scaleChange;
            updateCanvasTransform();
            e.preventDefault();
            return;
        }
        if(e.button === 0 || e.touches) {
            viewport.panning = true;
            viewport.startX = (e.touches ? e.touches[0].clientX : e.clientX) - viewport.pointX;
            viewport.startY = (e.touches ? e.touches[0].clientY : e.clientY) - viewport.pointY;
            e.preventDefault();
            return;
        }
        return;
    }
    if(window.animationState.isPlaying) return;
    const pos = getPos(e);
    if(selectedShape && selectedShape.type === "path") {
        const handle = selectedShape.getHandleAt(pos.x, pos.y);
        if(handle && handle.type === "path-handle") {
            activeHandle = handle;
            isEditingPoint = true;
            isDragging = false;
            window.undoManager.startBatch();
            window.dragStartState = captureObjectState(selectedShape);
            e.preventDefault();
            return;
        }
        const pointHandle = selectedShape.getHandleAt(pos.x, pos.y);
        if(pointHandle && pointHandle.type === "poly-point") {
            activeHandle = pointHandle;
            isEditingPoint = true;
            isDragging = false;
            window.undoManager.startBatch();
            window.dragStartState = captureObjectState(selectedShape);
            e.preventDefault();
            return;
        }
    }
    let clickedShape = null;
    for(let i = shapes.length - 1; i >= 0; i--) {
        if(shapes[i].isPointInside(pos.x, pos.y)) {
            clickedShape = shapes[i];
            break;
        }
    }
    if(selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path") && e.detail === 2) {
        selectedShape.finished = false;
        selectedShape.editable = true;
        penMode = true;
        isEditingPolyline = true;
        showToast("Edit Mode: Click to add points, Drag points to move, Right-click to finish", 'I');
        drawAll();
        e.preventDefault();
        return;
    }
    if(penMode && selectedShape && (selectedShape.type === "path" || selectedShape.type === "polyline")) {
        const existingHandle = selectedShape.getHandleAt(pos.x, pos.y);
        if(existingHandle && existingHandle.type === "poly-point") {
            e.preventDefault();
            return;
        }
        if(e.detail === 2) {
            penMode = false;
            isEditingPolyline = false;
            selectedShape.finished = true;
            selectedShape.editable = false;
            drawAll();
            return;
        }
        const local = selectedShape.worldToLocal(pos.x, pos.y);
        if(selectedShape.type === "path") {
            selectedShape.points.push({
                x: local.x,
                y: local.y,
                in: {
                    x: 0,
                    y: 0
                },
                out: {
                    x: 0,
                    y: 0
                },
                curve: false
            });
        } else {
            selectedShape.points.push({
                x: local.x,
                y: local.y
            });
        }
        drawAll();
        e.preventDefault();
        return;
    }
    if(e.button === 2 && selectedShape && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
        e.preventDefault();
        const handle = selectedShape.getHandleAt(pos.x, pos.y);
        if(handle && handle.type === "poly-point") {
            if(selectedShape.points.length > 1) {
                selectedShape.points.splice(handle.index, 1);
                if(window.undoManager) {
                    window.undoManager.startBatch();
                    window.dragStartState = captureObjectState(selectedShape);
                    window.undoManager.endBatch();
                }
                drawAll();
            }
            return;
        }
    }
    if(selectedShape) {
        activeHandle = selectedShape.getHandleAt(pos.x, pos.y);
        if(activeHandle && activeHandle.type === "poly-point") {
            isDragging = false;
            isEditingPoint = true;
            if(selectedShape.finished) {
                if(e.detail === 2) {
                    if(shapeManager) shapeManager.reEditShape();
                }
                return;
            }
            selectedShape.selected = true;
            window.undoManager.startBatch();
            window.dragStartState = captureObjectState(selectedShape);
            e.preventDefault();
            return;
        }
        if(selectedShape && selectedShape.finished && (selectedShape.type === "polyline" || selectedShape.type === "path") && e.detail === 2) {
            selectedShape.finished = false;
            selectedShape.editable = true;
            penMode = true;
            isEditingPolyline = true;
            showToast("Edit Mode: Click to add points, Right-click to finish", 'I');
            drawAll();
            e.preventDefault();
            return;
        }
        if(selectedShape && selectedShape.finished && (selectedShape.type === "polyline" || selectedShape.type === "path")) {
            if(activeHandle && (activeHandle.type === "poly-point" || activeHandle.type === "path-handle")) {
                activeHandle = null;
            }
        }
        if(activeHandle) {
            if(activeHandle.type === "poly-point" || activeHandle.type === "path-handle") {
                if(selectedShape.finished) {
                    if(e.detail === 2) {
                        if(shapeManager) shapeManager.reEditShape();
                    }
                    return;
                }
                selectedShape.selected = true;
                window.undoManager.startBatch();
                window.dragStartState = captureObjectState(selectedShape);
                e.preventDefault();
                return;
            }
            selectedShape.selected = true;
            const isStringHandle = typeof activeHandle === 'string';
            if(activeHandle === 'rotate' || activeHandle === 'scale' ||
                (isStringHandle && activeHandle.includes('stretch')) ||
                activeHandle === 'pivot' || activeHandle === 'skewX' || activeHandle === 'skewY') {
                window.undoManager.startBatch();
                window.dragStartState = captureObjectState(selectedShape);
            }
            if(activeHandle === 'pivot') {
                isDragging = false;
                isDraggingPivot = true;
                const pivotWorld = selectedShape.getPivotWorldPosition();
                dragOffsetPivot = {
                    x: pos.x - pivotWorld.x,
                    y: pos.y - pivotWorld.y
                };
                e.preventDefault();
                return;
            } else if(activeHandle === 'rotate') {
                isRotating = true;
                rotationBaseValue = selectedShape.rotation;
                accumulatedDelta = 0;
                if(selectedShape.pivotX !== 0 || selectedShape.pivotY !== 0) {
                    const pivot = selectedShape.getPivotWorldPosition();
                    rotationCenterX = pivot.x;
                    rotationCenterY = pivot.y;
                } else {
                    rotationCenterX = selectedShape.x;
                    rotationCenterY = selectedShape.y;
                }
                rotationStartAngle = Math.atan2(pos.y - rotationCenterY, pos.x - rotationCenterX);
                lastMouseAngle = rotationStartAngle;
                e.preventDefault();
                return;
            } else if(activeHandle === 'skewX' || activeHandle === 'skewY') {
                isDragging = false;
                isStretching = false;
                startSkew = {
                    x: selectedShape.skewX,
                    y: selectedShape.skewY
                };
                startSkewMouse = {
                    x: pos.x,
                    y: pos.y
                };
            } else if(activeHandle === 'scale') {
                isScaling = true;
                startScale = {
                    x: selectedShape.scaleX,
                    y: selectedShape.scaleY
                };
                startMouseDist = Math.sqrt((pos.x - selectedShape.x) ** 2 + (pos.y - selectedShape.y) ** 2);
            } else if(isStringHandle && activeHandle.startsWith('stretch')) {
                isStretching = true;
                stretchAxis = activeHandle;
                startScale = {
                    x: selectedShape.scaleX,
                    y: selectedShape.scaleY
                };
                dragOffset = {
                    x: pos.x,
                    y: pos.y
                };
            } else if(activeHandle === 'drag') {
                isDragging = true;
                dragOffset = {
                    x: pos.x - selectedShape.x,
                    y: pos.y - selectedShape.y
                };
                if(shapeManager) shapeManager.setSelectedShape(selectedShape);
                drawAll();
            } else {
                isDragging = true;
                dragOffset = {
                    x: pos.x - selectedShape.x,
                    y: pos.y - selectedShape.y
                };
                if(shapeManager) shapeManager.setSelectedShape(selectedShape);
                drawAll();
            }
            e.preventDefault();
            return;
        }
        if((selectedShape.type === "polyline" || selectedShape.type === "path") && !selectedShape.finished && penMode) {
            const minDist = 20 / viewport.scale;
            let tooClose = false;
            for(let p of selectedShape.points) {
                const world = selectedShape.localToWorld(p.x, p.y);
                if(Math.hypot(pos.x - world.x, pos.y - world.y) < minDist) {
                    tooClose = true;
                    break;
                }
            }
            if(!tooClose) {
                const local = selectedShape.worldToLocal(pos.x, pos.y);
                if(selectedShape.type === "path") {
                    selectedShape.points.push({
                        x: local.x,
                        y: local.y,
                        in: {
                            x: 0,
                            y: 0
                        },
                        out: {
                            x: 0,
                            y: 0
                        },
                        curve: false
                    });
                } else {
                    selectedShape.points.push({
                        x: local.x,
                        y: local.y
                    });
                }
                if(window.undoManager) {
                    window.undoManager.startBatch();
                    window.dragStartState = captureObjectState(selectedShape);
                }
                drawAll();
                e.preventDefault();
                return;
            }
        }
        if(selectedShape.finished && e.detail === 2) {
            if(shapeManager) shapeManager.reEditShape();
            e.preventDefault();
            return;
        }
    }
    // In onStart function, when clicking on a shape:
if (clickedShape && !isEditingPoint) {
    // Clear previous selection if not multi-selecting
    const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!isMultiSelect) {
        // Deselect all shapes including groups
        for (let shape of shapes) {
            shape.selected = false;
        }
        selectedShapes = [];
        selectedShape = null;
    }
    
    // Select the clicked shape
    clickedShape.selected = true;
    selectedShape = clickedShape;
    
    isDragging = true;
    dragOffset = {
        x: pos.x - selectedShape.x,
        y: pos.y - selectedShape.y
    };
    
    // Update selectedShapes array
    if (!selectedShapes.includes(clickedShape)) {
        selectedShapes.push(clickedShape);
    }
    
    if (shapeManager) shapeManager.setSelectedShape(clickedShape);
    drawAll();
    e.preventDefault();
    return;
}

/*
    if(clickedShape && !isEditingPoint) {
        selectedShape = clickedShape;
        shapes.forEach(s => s.selected = false);
        selectedShape.selected = true;
        isDragging = true;
        dragOffset = {
            x: pos.x - selectedShape.x,
            y: pos.y - selectedShape.y
        };
        if(shapeManager) shapeManager.setSelectedShape(selectedShape);
        drawAll();
        e.preventDefault();
        return;
    }
    */
    // Click on empty space - clear ALL selections including group children
    if (!clickedShape) {
        // Clear all selections recursively
        function clearAllSelectionsRecursively(obj) {
            obj.selected = false;
            if (obj.type === 'group' && obj.children) {
                obj.children.forEach(child => clearAllSelectionsRecursively(child));
            }
        }
        
        for (let shape of shapes) {
            clearAllSelectionsRecursively(shape);
        }
        
        selectedShapes = [];
        selectedShape = null;
        if (shapeManager) shapeManager.setSelectedShape(null);
        if (typeof updateSelectionDisplay === 'function') {
            updateSelectionDisplay();
        }
        drawAll();
        e.preventDefault();
        return;
    }
}

function onMove(e) {
    if(isDrawing) return;
    if(isMarqueeActive) {
        updateMarquee(e.clientX, e.clientY);
        e.preventDefault();
        return;
    }
    if(viewport.mode === 'canvas') {
        if(e.touches && e.touches.length === 2) {
            const rect = canvas.getBoundingClientRect();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
            const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            const prevScale = viewport.scale;
            viewport.scale = Math.max(0.1, viewport.startScale + (dist - viewport.startDist) * 0.005);
            const scaleChange = viewport.scale / prevScale;
            viewport.pointX = centerX - (centerX - viewport.pointX) * scaleChange;
            viewport.pointY = centerY - (centerY - viewport.pointY) * scaleChange;
            updateCanvasTransform();
            e.preventDefault();
            return;
        }
        if(viewport.panning) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            viewport.pointX = clientX - viewport.startX;
            viewport.pointY = clientY - viewport.startY;
            updateCanvasTransform();
            e.preventDefault();
            return;
        }
    }
    if(window.animationState.isPlaying || !selectedShape) return;
    const pos = getPos(e);
    if(isEditingPoint && activeHandle && activeHandle.type === "path-handle") {
        const i = activeHandle.index;
        const handle = activeHandle.handle;
        const local = selectedShape.worldToLocal(pos.x, pos.y);
        const pointLocal = selectedShape.points[i];
        selectedShape.points[i][handle].x = local.x - pointLocal.x;
        selectedShape.points[i][handle].y = local.y - pointLocal.y;
        if(!e.altKey) {
            if(handle === 'out') {
                selectedShape.points[i].in.x = -selectedShape.points[i].out.x;
                selectedShape.points[i].in.y = -selectedShape.points[i].out.y;
            } else {
                selectedShape.points[i].out.x = -selectedShape.points[i].in.x;
                selectedShape.points[i].out.y = -selectedShape.points[i].in.y;
            }
        }
        drawAll();
        e.preventDefault();
        return;
    }
    if(isEditingPoint && activeHandle && activeHandle.type === "poly-point") {
        const i = activeHandle.index;
        const local = selectedShape.worldToLocal(pos.x, pos.y);
        selectedShape.points[i].x = local.x;
        selectedShape.points[i].y = local.y;
        drawAll();
        e.preventDefault();
        return;
    }
    if(isDraggingPivot) {
        isDrawing = false;
        const newPivotWorldX = pos.x - dragOffsetPivot.x;
        const newPivotWorldY = pos.y - dragOffsetPivot.y;
        const cos = Math.cos(-selectedShape.rotation);
        const sin = Math.sin(-selectedShape.rotation);
        const dx = newPivotWorldX - selectedShape.x;
        const dy = newPivotWorldY - selectedShape.y;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        selectedShape.pivotX = localX / (selectedShape.scaleX || 1);
        selectedShape.pivotY = localY / (selectedShape.scaleY || 1);
        drawAll();
        e.preventDefault();
        return;
    }
    if(activeHandle !== null && typeof activeHandle === 'object' && activeHandle.type === "path-handle" && selectedShape !== null) {
        isDrawing = false;
        const i = activeHandle.index;
        const handle = activeHandle.handle;
        const local = selectedShape.worldToLocal(pos.x, pos.y);
        const pointLocal = selectedShape.points[i];
        selectedShape.points[i][handle].x = local.x - pointLocal.x;
        selectedShape.points[i][handle].y = local.y - pointLocal.y;
        if(handle === 'out') {
            selectedShape.points[i].in.x = -selectedShape.points[i].out.x;
            selectedShape.points[i].in.y = -selectedShape.points[i].out.y;
        } else {
            selectedShape.points[i].out.x = -selectedShape.points[i].in.x;
            selectedShape.points[i].out.y = -selectedShape.points[i].in.y;
        }
        drawAll();
        e.preventDefault();
        return;
    }
    if(isRotating) {
        isDrawing = false;
        const currentAngle = Math.atan2(pos.y - rotationCenterY, pos.x - rotationCenterX);
        let frameDelta = currentAngle - lastMouseAngle;
        if(frameDelta > Math.PI) frameDelta -= 2 * Math.PI;
        if(frameDelta < -Math.PI) frameDelta += 2 * Math.PI;
        accumulatedDelta += frameDelta;
        selectedShape.rotation = rotationBaseValue + accumulatedDelta;
        lastMouseAngle = currentAngle;
        if(selectedShape.pivotX !== 0 || selectedShape.pivotY !== 0) {
            const pivotLocalX = selectedShape.pivotX * selectedShape.scaleX;
            const pivotLocalY = selectedShape.pivotY * selectedShape.scaleY;
            const cos = Math.cos(selectedShape.rotation);
            const sin = Math.sin(selectedShape.rotation);
            selectedShape.x = rotationCenterX + (-pivotLocalX * cos + pivotLocalY * sin);
            selectedShape.y = rotationCenterY + (-pivotLocalX * sin - pivotLocalY * cos);
        }
        drawAll();
        e.preventDefault();
        return;
    } else if(isScaling) {
        isDrawing = false;
        const dist = Math.sqrt((pos.x - selectedShape.x) ** 2 + (pos.y - selectedShape.y) ** 2);
        if(startMouseDist === 0) startMouseDist = 1;
        const ratio = dist / startMouseDist;
        selectedShape.scaleX = Math.max(0.1, startScale.x * ratio);
        selectedShape.scaleY = Math.max(0.1, startScale.y * ratio);
        drawAll();
        e.preventDefault();
    } else if(isStretching) {
        isDrawing = false;
        const dx = pos.x - dragOffset.x;
        const dy = pos.y - dragOffset.y;
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        const worldDX = dx * sx;
        const worldDY = dy * sy;
        const r = selectedShape.rotation;
        const cos = Math.cos(-r);
        const sin = Math.sin(-r);
        const localDX = worldDX * cos - worldDY * sin;
        const localDY = worldDX * sin + worldDY * cos;
        if(stretchAxis === 'stretch-x-right') {
            const newScale = Math.max(0.05, startScale.x + localDX * 0.01);
            const diff = newScale - selectedShape.scaleX;
            selectedShape.scaleX = newScale;
            if(selectedShape.type === "group") {
                const boundsBefore = selectedShape.getBounds();
                const leftEdge = boundsBefore.minX;
                selectedShape.x += (leftEdge - selectedShape.getBounds().minX);
            } else {
                selectedShape.x += Math.cos(r) * (diff * selectedShape.size / 2);
                selectedShape.y += Math.sin(r) * (diff * selectedShape.size / 2);
            }
        } else if(stretchAxis === 'stretch-x-left') {
            const newScale = Math.max(0.05, startScale.x - localDX * 0.01);
            const diff = newScale - selectedShape.scaleX;
            selectedShape.scaleX = newScale;
            if(selectedShape.type === "group") {
                const boundsBefore = selectedShape.getBounds();
                const rightEdge = boundsBefore.maxX;
                selectedShape.x += (rightEdge - selectedShape.getBounds().maxX);
            } else {
                selectedShape.x -= Math.cos(r) * (diff * selectedShape.size / 2);
                selectedShape.y -= Math.sin(r) * (diff * selectedShape.size / 2);
            }
        } else if(stretchAxis === 'stretch-y-bottom') {
            const newScale = Math.max(0.05, startScale.y + localDY * 0.01);
            const diff = newScale - selectedShape.scaleY;
            selectedShape.scaleY = newScale;
            if(selectedShape.type === "group") {
                const boundsBefore = selectedShape.getBounds();
                const topEdge = boundsBefore.minY;
                selectedShape.y += (topEdge - selectedShape.getBounds().minY);
            } else {
                selectedShape.x += -Math.sin(r) * (diff * selectedShape.size / 2);
                selectedShape.y += Math.cos(r) * (diff * selectedShape.size / 2);
            }
        } else if(stretchAxis === 'stretch-y-top') {
            const newScale = Math.max(0.05, startScale.y - localDY * 0.01);
            const diff = newScale - selectedShape.scaleY;
            selectedShape.scaleY = newScale;
            if(selectedShape.type === "group") {
                const boundsBefore = selectedShape.getBounds();
                const bottomEdge = boundsBefore.maxY;
                selectedShape.y += (bottomEdge - selectedShape.getBounds().maxY);
            } else {
                selectedShape.x -= -Math.sin(r) * (diff * selectedShape.size / 2);
                selectedShape.y -= Math.cos(r) * (diff * selectedShape.size / 2);
            }
        }
        drawAll();
        e.preventDefault();
    } else if(isDragging && !isEditingPoint) {
        isDrawing = false;
        selectedShape.x = pos.x - dragOffset.x;
        selectedShape.y = pos.y - dragOffset.y;
        drawAll();
        e.preventDefault();
    } else if(activeHandle === 'skewX') {
        isDrawing = false;
        const dx = pos.x - startSkewMouse.x;
        selectedShape.skewX = startSkew.x + dx * 0.005;
        drawAll();
        e.preventDefault();
    } else if(activeHandle === 'skewY') {
        isDrawing = false;
        const dy = pos.y - startSkewMouse.y;
        selectedShape.skewY = startSkew.y + dy * 0.005;
        drawAll();
        e.preventDefault();
    }
}

function onEnd(e) {
    isEditingPoint = false;
    if(isMarqueeActive) {
        endMarquee();
        e.preventDefault();
        return;
    }
    viewport.panning = false;
    const isStringHandle = typeof activeHandle === 'string';
    const isObjectHandle = typeof activeHandle === 'object' && activeHandle !== null;
    const isTransformHandle = (
        isStringHandle &&
        (activeHandle === 'rotate' || activeHandle === 'scale' ||
            activeHandle.includes('stretch') || activeHandle === 'pivot' ||
            activeHandle === 'skewX' || activeHandle === 'skewY' || activeHandle === 'drag')
    );
    const isPointHandle = (
        isObjectHandle &&
        (activeHandle.type === 'poly-point' || activeHandle.type === 'path-handle')
    );
    if((isDragging || isScaling || isRotating || isStretching || isDraggingPivot || isPointHandle) &&
        selectedShape !== null && selectedShape !== undefined && window.undoManager) {
        const endState = captureObjectState(selectedShape);
        if(window.dragStartState &&
            JSON.stringify(window.dragStartState) !== JSON.stringify(endState)) {
            const undoCmd = new ObjectStateCommand(
                selectedShape,
                window.dragStartState,
                endState,
                drawAll
            );
            window.undoManager.execute(undoCmd);
        }
        window.undoManager.endBatch();
        updateUndoRedoButtons();
    }
    if(selectedShape !== null && selectedShape !== undefined) {
        if(selectedShape.type === "polyline" || selectedShape.type === "path") {
            selectedShape.applyTransformToPoints();
        }
    }
    isDragging = false;
    isScaling = false;
    isRotating = false;
    isStretching = false;
    isDraggingPivot = false;
    activeHandle = null;
    accumulatedDelta = 0;
    window.dragStartState = null;
}