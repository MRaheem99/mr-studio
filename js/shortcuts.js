/* Keyboard shortcuts

Arrow Keys	                            Move selected object by 1px
Shift + Arrow Keys	                    Move selected object by 10px
Ctrl + Arrow Keys	                    Rotate by 5°
Ctrl + Shift + Arrow Keys	            Rotate by 15°
Delete / Del	                        Delete selected object(s)
Ctrl + C	                            Copy selected object(s)
Ctrl + V	                            Paste copied object(s)
Ctrl + X	                            Cut selected object(s)
Ctrl + D	                            Duplicate selected object(s)
Ctrl + E	                            Open Edit Properties modal
Ctrl + G	                            Group selected objects
Ctrl + Shift + G	                    Ungroup selected group
Ctrl + A	                            Select all objects
Ctrl + Z	                            Undo
Ctrl + Y / Ctrl + Shift + Z	            Redo
Ctrl + ]	                            Bring Forward (one step)
Ctrl + [	                            Send Backward (one step)
Ctrl + Shift + ]	                    Bring to Front
Ctrl + Shift + [	                    Send to Back
Ctrl + L	Lock/Unlock                 object
Ctrl + H	Hide/Show                   object
Ctrl + Shift + C	                    Center object on canvas
Ctrl + R	                            Reset transform
Ctrl + Shift + H	                    Flip Horizontal
Ctrl + Shift + V	                    Flip Vertical
Ctrl + Shift + E	                    Open Export dialog
Ctrl + Shift + N	                    New Project
Space	Play/Pause                      animation
Home	                                Go to start of animation
End	                                    Go to end of animation
Escape	                                Clear selection
P	                                    Pencil tool
B	                                    Brush tool
E	                                    Eraser tool
V	                                    Object mode (Select)
H	                                    Canvas mode (Pan)
F	                                    Finish drawing
N	                                    Add new shape
T	                                    Add text
I	                                    Import image
Ctrl + O	                            Import project
Ctrl + + / Ctrl + =	                    Zoom in (Canvas mode)
Ctrl + -	                            Zoom out (Canvas mode)
Ctrl + 0	                            Reset zoom (Canvas mode)
F11 / Ctrl + Shift + F	                Fullscreen preview

*/

document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    
    // ========== UNDO / REDO (Highest Priority) ==========
    if (isCtrl && e.key === 'z' && !isShift) {
        e.preventDefault();
        e.stopPropagation();
        if (window.undoManager && window.undoManager.undo()) {
            updateUndoRedoButtons();
            drawAll();
            rebuildTracks();
        }
        return;
    }
    
    if ((isCtrl && e.key === 'y') || (isCtrl && isShift && e.key === 'z')) {
        e.preventDefault();
        e.stopPropagation();
        if (window.undoManager && window.undoManager.redo()) {
            updateUndoRedoButtons();
            drawAll();
            rebuildTracks();
        }
        return;
    }
    
    // ========== DELETE ==========
    if (e.key === 'Delete' || e.key === 'Del') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShapes && selectedShapes.length > 0) {
            const shapesToDelete = [...selectedShapes];
            shapesToDelete.forEach(shape => {
                const index = shapes.indexOf(shape);
                if (index !== -1) shapes.splice(index, 1);
            });
            clearSelection();
            drawAll();
            rebuildTracks();
        } else if (selectedShape) {
            const index = shapes.indexOf(selectedShape);
            if (index !== -1) shapes.splice(index, 1);
            selectedShape = null;
            if (shapeManager) shapeManager.setSelectedShape(null);
            drawAll();
            rebuildTracks();
        }
        return;
    }
    
    // ========== ROTATION (Ctrl + Arrow Keys) ==========
    if (isCtrl && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        const rotationStep = isShift ? 5 : 1;
        if (selectedShapes && selectedShapes.length > 0) {
            selectedShapes.forEach(shape => {
                if (e.key === 'ArrowRight') {
                    shape.rotation += rotationStep * Math.PI / 180;
                } else if (e.key === 'ArrowLeft') {
                    shape.rotation -= rotationStep * Math.PI / 180;
                }
            });
            drawAll();
        } else if (selectedShape) {
            if (e.key === 'ArrowRight') {
                selectedShape.rotation += rotationStep * Math.PI / 180;
            } else if (e.key === 'ArrowLeft') {
                selectedShape.rotation -= rotationStep * Math.PI / 180;
            }
            drawAll();
        }
        return;
    }
    
    // ========== MOVE (Arrow Keys) ==========
    const moveStep = isShift ? 10 : 1;
    let moved = false;
    
    if (selectedShapes && selectedShapes.length > 0) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                e.stopPropagation();
                selectedShapes.forEach(shape => { shape.x -= moveStep; });
                moved = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                selectedShapes.forEach(shape => { shape.x += moveStep; });
                moved = true;
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                selectedShapes.forEach(shape => { shape.y -= moveStep; });
                moved = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                selectedShapes.forEach(shape => { shape.y += moveStep; });
                moved = true;
                break;
        }
        if (moved) {
            drawAll();
            return;
        }
    } else if (selectedShape && (!selectedShapes || selectedShapes.length === 0)) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                e.stopPropagation();
                selectedShape.x -= moveStep;
                moved = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                selectedShape.x += moveStep;
                moved = true;
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                selectedShape.y -= moveStep;
                moved = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                selectedShape.y += moveStep;
                moved = true;
                break;
        }
        if (moved) {
            drawAll();
            return;
        }
    }
    
    // ========== COPY, CUT, PASTE, DUPLICATE ==========
    if (isCtrl && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        copySelectedShapes();
        return;
    }
    
    if (isCtrl && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        pasteShapes();
        return;
    }
    
    if (isCtrl && e.key === 'x') {
        e.preventDefault();
        e.stopPropagation();
        cutSelectedShapes();
        return;
    }
    
    if (isCtrl && e.key === 'd') {
        e.preventDefault();
        e.stopPropagation();
        duplicateSelectedShapes();
        return;
    }
    
    // ========== EDIT PROPERTIES ==========
    if (isCtrl && e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape && shapeManager) {
            shapeManager.openModal();
        } else {
            showToast("Select an object first", 'I');
        }
        return;
    }
    
    // ========== GROUP / UNGROUP ==========
    if (isCtrl && e.key === 'g' && !isShift) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof groupSelected === 'function') groupSelected();
        return;
    }
    
    if (isCtrl && isShift && e.key === 'g') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof ungroupSelected === 'function') ungroupSelected();
        return;
    }
    
    // ========== SELECT ALL ==========
    if (isCtrl && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        selectAllShapes();
        return;
    }
    
    // ========== ESCAPE ==========
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // Check if confirm dialog is open
        const confirmModal = document.getElementById('confirmDialog');
        if (confirmModal && confirmModal.classList.contains('open')) {
            confirmModal.classList.remove('open');
            return;
        }
        clearSelection();
        return;
    }
    
    // ========== PLAYBACK CONTROLS ==========
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        if (window.animationState.isPlaying) {
            if (btnPause) btnPause.click();
        } else {
            if (btnPlay) btnPlay.click();
        }
        return;
    }
    
    if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        if (window.seekAnimation) window.seekAnimation(0);
        return;
    }
    
    if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        if (window.seekAnimation) window.seekAnimation(window.animationState.duration);
        return;
    }
    
    // ========== ZOOM CONTROLS (Canvas Mode) ==========
    if (isCtrl && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        e.stopPropagation();
        if (viewport.mode === 'canvas') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const prevScale = viewport.scale;
            const newScale = Math.min(5, prevScale * 1.1);
            const scaleChange = newScale / prevScale;
            viewport.scale = newScale;
            viewport.pointX = centerX - (centerX - viewport.pointX) * scaleChange;
            viewport.pointY = centerY - (centerY - viewport.pointY) * scaleChange;
            updateCanvasTransform();
        }
        return;
    }
    
    if (isCtrl && e.key === '-') {
        e.preventDefault();
        e.stopPropagation();
        if (viewport.mode === 'canvas') {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const prevScale = viewport.scale;
            const newScale = Math.max(0.1, prevScale * 0.9);
            const scaleChange = newScale / prevScale;
            viewport.scale = newScale;
            viewport.pointX = centerX - (centerX - viewport.pointX) * scaleChange;
            viewport.pointY = centerY - (centerY - viewport.pointY) * scaleChange;
            updateCanvasTransform();
        }
        return;
    }
    
    if (isCtrl && e.key === '0') {
        e.preventDefault();
        e.stopPropagation();
        if (viewport.mode === 'canvas') {
            fitCanvasToScreen();
        }
        return;
    }
    
    // ========== TOOL SHORTCUTS ==========
    if (e.key === 'p' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof setDrawingTool === 'function') setDrawingTool('pencil');
        return;
    }
    
    if (e.key === 'b' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof setDrawingTool === 'function') setDrawingTool('brush');
        return;
    }
    
    if (e.key === 'e' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof setDrawingTool === 'function') setDrawingTool('eraser');
        return;
    }
    
    if (e.key === 'v' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        setMode('object');
        showToast("Object Mode", 'I');
        return;
    }
    
    if (e.key === 'h' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        setMode('canvas');
        showToast("Canvas Mode - Pan with mouse", 'I');
        return;
    }
    
    if (e.key === 'f' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof finishDrawing === 'function') finishDrawing();
        return;
    }
    
    if (e.key === 'n' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (btnAddShape) btnAddShape.click();
        return;
    }
    
    if (e.key === 't' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (btnAddText) btnAddText.click();
        return;
    }
    
    if (e.key === 'i' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        if (btnAddImage) btnAddImage.click();
        return;
    }
    
    // ========== IMPORT PROJECT ==========
    if (isCtrl && e.key === 'o') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof importProject === 'function') importProject();
        return;
    }
    
    // ========== LAYER ORDER SHORTCUTS ==========
    // Ctrl + Shift + ] - Bring to Front
    if (isCtrl && isShift && e.key === ']') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldIndex = shapes.indexOf(selectedShape);
            if (oldIndex !== -1 && oldIndex !== shapes.length - 1) {
                shapes.splice(oldIndex, 1);
                shapes.push(selectedShape);
                drawAll();
                rebuildTracks();
                showToast("Bring to Front", 'I');
            }
        } else if (selectedShapes && selectedShapes.length > 0) {
            selectedShapes.forEach(shape => {
                const oldIndex = shapes.indexOf(shape);
                if (oldIndex !== -1) {
                    shapes.splice(oldIndex, 1);
                    shapes.push(shape);
                }
            });
            drawAll();
            rebuildTracks();
            showToast(`Brought ${selectedShapes.length} object(s) to Front`, 'I');
        }
        return;
    }
    
    // Ctrl + Shift + [ - Send to Back
    if (isCtrl && isShift && e.key === '[') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldIndex = shapes.indexOf(selectedShape);
            if (oldIndex !== -1 && oldIndex !== 0) {
                shapes.splice(oldIndex, 1);
                shapes.unshift(selectedShape);
                drawAll();
                rebuildTracks();
                showToast("Send to Back", 'I');
            }
        } else if (selectedShapes && selectedShapes.length > 0) {
            // Move to back in reverse order to maintain relative order
            const shapesToMove = [...selectedShapes];
            shapesToMove.reverse().forEach(shape => {
                const oldIndex = shapes.indexOf(shape);
                if (oldIndex !== -1) {
                    shapes.splice(oldIndex, 1);
                    shapes.unshift(shape);
                }
            });
            drawAll();
            rebuildTracks();
            showToast(`Sent ${selectedShapes.length} object(s) to Back`, 'I');
        }
        return;
    }
    
    // ========== BRING FORWARD / SEND BACKWARD (Single step) ==========
    // Ctrl + ] - Bring Forward (one step)
    if (isCtrl && !isShift && e.key === ']') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldIndex = shapes.indexOf(selectedShape);
            if (oldIndex !== -1 && oldIndex < shapes.length - 1) {
                shapes.splice(oldIndex, 1);
                shapes.splice(oldIndex + 1, 0, selectedShape);
                drawAll();
                rebuildTracks();
                showToast("Bring Forward", 'I');
            }
        }
        return;
    }
    
    // Ctrl + [ - Send Backward (one step)
    if (isCtrl && !isShift && e.key === '[') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldIndex = shapes.indexOf(selectedShape);
            if (oldIndex !== -1 && oldIndex > 0) {
                shapes.splice(oldIndex, 1);
                shapes.splice(oldIndex - 1, 0, selectedShape);
                drawAll();
                rebuildTracks();
                showToast("Send Backward", 'I');
            }
        }
        return;
    }
    
    // ========== LOCK / UNLOCK OBJECT ==========
    // Ctrl + L - Lock selected object
    if (isCtrl && e.key === 'l') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.locked = !selectedShape.locked;
            showToast(selectedShape.locked ? "Object Locked" : "Object Unlocked", 'I');
            drawAll();
        } else if (selectedShapes && selectedShapes.length > 0) {
            const lockState = !selectedShapes[0].locked;
            selectedShapes.forEach(shape => {
                shape.locked = lockState;
            });
            showToast(lockState ? `${selectedShapes.length} object(s) Locked` : `${selectedShapes.length} object(s) Unlocked`, 'I');
            drawAll();
        }
        return;
    }
    
    // ========== HIDE / SHOW OBJECT ==========
    // Ctrl + H - Hide selected object
    if (isCtrl && e.key === 'h') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.visible = selectedShape.visible === undefined ? false : !selectedShape.visible;
            showToast(selectedShape.visible === false ? "Object Hidden" : "Object Visible", 'I');
            drawAll();
        }
        return;
    }
    
    // ========== CENTER SELECTED OBJECT ==========
    // Ctrl + Shift + C - Center selected object on canvas
    if (isCtrl && isShift && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.x = canvas.width / 2;
            selectedShape.y = canvas.height / 2;
            drawAll();
            showToast("Centered object", 'I');
        }
        return;
    }
    
    // ========== RESET TRANSFORM ==========
    // Ctrl + R - Reset transform (rotation, scale, skew)
    if (isCtrl && e.key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.rotation = 0;
            selectedShape.scaleX = 1;
            selectedShape.scaleY = 1;
            selectedShape.skewX = 0;
            selectedShape.skewY = 0;
            selectedShape.pivotX = 0;
            selectedShape.pivotY = 0;
            drawAll();
            showToast("Transform reset", 'I');
        }
        return;
    }
    
    // ========== FLIP HORIZONTAL ==========
    // Ctrl + Shift + H - Flip horizontal
    if (isCtrl && isShift && e.key === 'h') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.scaleX = -(selectedShape.scaleX || 1);
            drawAll();
            showToast("Flip Horizontal", 'I');
        }
        return;
    }
    
    // ========== FLIP VERTICAL ==========
    // Ctrl + Shift + V - Flip vertical
    if (isCtrl && isShift && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            selectedShape.scaleY = -(selectedShape.scaleY || 1);
            drawAll();
            showToast("Flip Vertical", 'I');
        }
        return;
    }
    
    // ========== TOGGLE GRID ==========
    // Ctrl + G - Toggle grid (if you have grid feature)
    if (isCtrl && e.key === 'g' && !isShift) {
        // This is already used for grouping, so use different key
        // Skip to avoid conflict
    }
    
    // ========== EXPORT SHORTCUT ==========
    // Ctrl + Shift + E - Export
    if (isCtrl && isShift && e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        const exportBtn = document.getElementById('btnExportAdvanced');
        if (exportBtn) exportBtn.click();
        return;
    }
    
    // ========== NEW PROJECT ==========
    // Ctrl + Shift + N - New project (clear all)
    if (isCtrl && isShift && e.key === 'n') {
        e.preventDefault();
        e.stopPropagation();
        showConfirmDialog(
            "New Project",
            "Create a new project? All current work will be lost.",
            () => {
                shapes = [];
                selectedShape = null;
                selectedShapes = [];
                window.animationState.currentTime = 0;
                window.animationState.duration = 0;
                clearSelection();
                drawAll();
                rebuildTracks();
                showToast("New project created", 'S');
            }
        );
        return;
    }
    
    // ========== PREVIEW FULLSCREEN ==========
    // F11 or Ctrl + Shift + F - Fullscreen preview
    if ((e.key === 'F11') || (isCtrl && isShift && e.key === 'f')) {
        e.preventDefault();
        e.stopPropagation();
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
            showToast("Fullscreen mode", 'I');
        }
        return;
    }
});

// ========== COPY, CUT, PASTE FUNCTIONS ==========

let copiedShapes = [];

function copySelectedShapes() {
    if (!selectedShape && (!selectedShapes || selectedShapes.length === 0)) {
        showToast("No object selected", 'I');
        return;
    }
    copiedShapes = [];
    const shapesToCopy = selectedShapes && selectedShapes.length > 0 ? selectedShapes : [selectedShape];
    shapesToCopy.forEach(shape => {
        let copy;
        if (shape.type === "group") {
            copy = copyGroup(shape);
        } else {
            copy = copyShape(shape);
        }
        copiedShapes.push(copy);
    });
}

function copyShape(original) {
    const copy = new Shape(original.type, original.x, original.y, original.size);
    const props = ['rotation', 'scaleX', 'scaleY', 'skewX', 'skewY', 'pivotX', 'pivotY',
        'opacity', 'color', 'borderWidth', 'borderColor', 'borderOffset', 'borderBlur',
        'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'shadowOpacity',
        'text', 'fontSize', 'fontFamily', 'filterBrightness', 'filterContrast',
        'filterSaturation', 'filterBlur', 'bgImage', 'bgFit', 'bgOffsetX', 'bgOffsetY', 'bgScale'
    ];
    props.forEach(prop => {
        if (original[prop] !== undefined) copy[prop] = original[prop];
    });
    if (original.points) copy.points = JSON.parse(JSON.stringify(original.points));
    if (original.segments) copy.segments = JSON.parse(JSON.stringify(original.segments));
    if (original.imageObj) copy.imageObj = original.imageObj;
    if (original.bgImageObj) copy.bgImageObj = original.bgImageObj;
    copy.keyframes = [];
    return copy;
}

function copyGroup(original) {
    const copy = new Group(original.name + " Copy");
    copy.x = original.x;
    copy.y = original.y;
    copy.rotation = original.rotation;
    copy.scaleX = original.scaleX;
    copy.scaleY = original.scaleY;
    copy.skewX = original.skewX;
    copy.skewY = original.skewY;
    copy.pivotX = original.pivotX;
    copy.pivotY = original.pivotY;
    copy.opacity = original.opacity;
    copy.color = original.color;
    copy.borderColor = original.borderColor;
    copy.borderWidth = original.borderWidth;
    copy.shadowColor = original.shadowColor;
    copy.shadowBlur = original.shadowBlur;
    copy.shadowOffsetX = original.shadowOffsetX;
    copy.shadowOffsetY = original.shadowOffsetY;
    copy.shadowOpacity = original.shadowOpacity;
    original.children.forEach(child => {
        let childCopy;
        if (child.type === "group") {
            childCopy = copyGroup(child);
        } else {
            childCopy = copyShape(child);
        }
        childCopy.x = child.x;
        childCopy.y = child.y;
        childCopy.parentGroup = copy;
        copy.children.push(childCopy);
    });
    return copy;
}

function pasteShapes() {
    if (copiedShapes.length === 0) {
        showToast("Nothing to paste", 'I');
        return;
    }
    const newShapes = [];
    copiedShapes.forEach(copied => {
        let newShape;
        if (copied.type === "group") {
            newShape = copyGroup(copied);
            newShape.x += 20;
            newShape.y += 20;
            newShape.name = copied.name;
        } else {
            newShape = copyShape(copied);
            newShape.x += 20;
            newShape.y += 20;
        }
        newShapes.push(newShape);
        shapes.push(newShape);
    });
    clearSelection();
    newShapes.forEach(shape => {
        shape.selected = true;
        selectedShapes.push(shape);
    });
    selectedShape = newShapes[newShapes.length - 1];
    if (shapeManager) shapeManager.setSelectedShape(selectedShape);
    drawAll();
    rebuildTracks();
}

function cutSelectedShapes() {
    if (!selectedShape && (!selectedShapes || selectedShapes.length === 0)) {
        showToast("No object selected", 'I');
        return;
    }
    copySelectedShapes();
    const shapesToDelete = selectedShapes && selectedShapes.length > 0 ? [...selectedShapes] : [selectedShape];
    shapesToDelete.forEach(shape => {
        const index = shapes.indexOf(shape);
        if (index !== -1) shapes.splice(index, 1);
    });
    clearSelection();
    drawAll();
    rebuildTracks();
}

function duplicateSelectedShapes() {
    if (!selectedShape && (!selectedShapes || selectedShapes.length === 0)) {
        showToast("No object selected", 'I');
        return;
    }
    const shapesToDuplicate = selectedShapes && selectedShapes.length > 0 ? [...selectedShapes] : [selectedShape];
    const newShapes = [];
    shapesToDuplicate.forEach(shape => {
        let newShape;
        if (shape.type === "group") {
            newShape = copyGroup(shape);
        } else {
            newShape = copyShape(shape);
        }
        newShape.x += 20;
        newShape.y += 20;
        newShapes.push(newShape);
        shapes.push(newShape);
    });
    clearSelection();
    newShapes.forEach(shape => {
        shape.selected = true;
        selectedShapes.push(shape);
    });
    selectedShape = newShapes[newShapes.length - 1];
    if (shapeManager) shapeManager.setSelectedShape(selectedShape);
    drawAll();
    rebuildTracks();
}

// Select all shapes function
function selectAllShapes() {
    if (shapes.length === 0) {
        showToast("No objects to select", 'I');
        return;
    }
    
    // Clear current selection
    for (let shape of shapes) {
        shape.selected = false;
    }
    selectedShapes = [];
    
    // Select all shapes
    for (let shape of shapes) {
        shape.selected = true;
        selectedShapes.push(shape);
    }
    
    if (selectedShapes.length > 0) {
        selectedShape = selectedShapes[selectedShapes.length - 1];
        if (shapeManager) shapeManager.setSelectedShape(selectedShape);
    }
    
    if (typeof updateSelectionDisplay === 'function') {
        updateSelectionDisplay();
    }
    
    drawAll();
    rebuildTracks();
    showToast(`Selected ${selectedShapes.length} objects`, 'S');
}