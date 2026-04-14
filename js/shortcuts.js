/* Keyboard shortcuts

--------------------------------------------------------------------------
| Arrow Keys                   |	        Move selected object by 1px  |
--------------------------------------------------------------------------
| Shift + Arrow Keys	       |            Move selected object by 10px |
| Ctrl + Arrow Keys	           |            Rotate by 5deg               |
| Ctrl + Shift + Arrow Keys	   |            Rotate by 15deg              |
| Delete / Del	               |            Delete selected object(s)    |
| Ctrl + C	                   |            Copy selected object(s)      |
| Ctrl + V	                   |            Paste copied object(s)       |
| Ctrl + X	                   |            Cut selected object(s)       |
| Ctrl + D	                   |            Duplicate selected object(s) |
| Ctrl + E	                   |            Open Edit Properties modal   |
| Ctrl + G	                   |            Group selected objects       |
| Ctrl + Shift + G	           |            Ungroup selected group       |
| Ctrl + A	                   |            Select all objects           |
| Ctrl + Z	                   |            Undo                         |
| Ctrl + Y / Ctrl + Shift + Z  |	        Redo                         |
| Ctrl + ]	                   |            Bring Forward (one step)     |
| Ctrl + [	                   |            Send Backward (one step)     |
| Ctrl + Shift + ]	           |            Bring to Front               |
| Ctrl + Shift + [	           |            Send to Back                 |
| Ctrl + L	Lock/Unlock        |            object                       |
| Ctrl + H	Hide/Show          |            object                       |
| Ctrl + Shift + C	           |            Center object on canvas      |
| Ctrl + R	                   |            Reset transform              | 
| Ctrl + Shift + H	           |            Flip Horizontal              |
| Ctrl + Shift + V	           |            Flip Vertical                |
| Ctrl + Shift + E	           |            Open Export dialog           |
| Ctrl + Shift + N	           |            New Project                  |
| Space	Play/Pause             |            animation                    |
| Home	                       |            Go to start of animation     |
| End	                       |            Go to end of animation       |
| Escape	                   |            Clear selection              |
| Q	                           |            Selection tool               |
| P	                           |            Pencil tool                  |
| B	                           |            Brush tool                   |
| E	                           |            Eraser tool                  |
| V	                           |            Object mode (Select)         |
| H	                           |            Canvas mode (Pan)            |
| F	                           |            Finish drawing               |
| N	                           |            Add new shape                |
| T	                           |            Add text                     |
| I	                           |            Import image                 |
| Ctrl + O	                   |            Import project               |
| Ctrl + + / Ctrl + =	       |            Zoom in (Canvas mode)        |
| Ctrl + -	                   |            Zoom out (Canvas mode)       |
| Ctrl + 0	                   |            Reset zoom (Canvas mode)     |
| F11 / Ctrl + Shift + F	   |            Fullscreen preview           |
--------------------------------------------------------------------------

*/

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
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
    
    if (e.key === 'Delete' || e.key === 'Del') {
        e.preventDefault();
        e.stopPropagation();
        
        const shapesToDelete = selectedShapes && selectedShapes.length > 0 ? [...selectedShapes] : (selectedShape ? [selectedShape] : []);
        
        if (shapesToDelete.length === 0) return;
        
        const deletedShapes = [];
        const deletedIndices = [];
        
        shapesToDelete.forEach(shape => {
            const index = shapes.indexOf(shape);
            if (index !== -1) {
                const clonedShape = cloneShapeForUndo(shape);
                deletedShapes.push(clonedShape);
                deletedIndices.push(index);
            }
        });
        
        shapesToDelete.forEach(shape => {
            const index = shapes.indexOf(shape);
            if (index !== -1) shapes.splice(index, 1);
        });
        
        clearSelection();
        drawAll();
        rebuildTracks();
        
        if (window.undoManager) {
            const deleteCommand = {
                execute: () => {
                    shapesToDelete.forEach(shape => {
                        const idx = shapes.indexOf(shape);
                        if (idx !== -1) shapes.splice(idx, 1);
                    });
                    clearSelection();
                    drawAll();
                    rebuildTracks();
                },
                undo: () => {
                    for (let i = 0; i < deletedShapes.length; i++) {
                        const restoredShape = restoreShapeFromClone(deletedShapes[i]);
                        shapes.splice(deletedIndices[i], 0, restoredShape);
                    }
                    drawAll();
                    rebuildTracks();
                }
            };
            window.undoManager.execute(deleteCommand);
        }
        return;
    }
    if (isCtrl && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        copySelectedShapes();
        return;
    }
    if (isCtrl && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        if (copiedShapes.length === 0) {
            showToast("Nothing to paste", 'I');
            return;
        }
        const newShapes = [];
        const pastedShapes = [];
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
            pastedShapes.push(newShape);
        });
        clearSelection();
        pastedShapes.forEach(shape => {
            shape.selected = true;
            selectedShapes.push(shape);
        });
        selectedShape = pastedShapes[pastedShapes.length - 1];
        if (shapeManager) shapeManager.setSelectedShape(selectedShape);
        drawAll();
        rebuildTracks();
        if (window.undoManager) {
            const pasteCommand = {
                execute: () => {
                    newShapes.forEach(shape => shapes.push(shape));
                    clearSelection();
                    newShapes.forEach(shape => {
                        shape.selected = true;
                        selectedShapes.push(shape);
                    });
                    selectedShape = newShapes[newShapes.length - 1];
                    drawAll();
                    rebuildTracks();
                },
                undo: () => {
                    newShapes.forEach(shape => {
                        const idx = shapes.indexOf(shape);
                        if (idx !== -1) shapes.splice(idx, 1);
                    });
                    clearSelection();
                    drawAll();
                    rebuildTracks();
                }
            };
            window.undoManager.execute(pasteCommand);
        }
        return;
    }
    if (isCtrl && e.key === 'x') {
        e.preventDefault();
        e.stopPropagation();
        const shapesToCut = selectedShapes && selectedShapes.length > 0 ? [...selectedShapes] : (selectedShape ? [selectedShape] : []);
        if (shapesToCut.length === 0) {
            showToast("No object selected", 'I');
            return;
        }
        copySelectedShapes();
        const cutShapes = [];
        const cutIndices = [];
        shapesToCut.forEach(shape => {
            const index = shapes.indexOf(shape);
            if (index !== -1) {
                cutShapes.push(shape);
                cutIndices.push(index);
            }
        });
        cutShapes.forEach(shape => {
            const index = shapes.indexOf(shape);
            if (index !== -1) shapes.splice(index, 1);
        });
        clearSelection();
        drawAll();
        rebuildTracks();
        if (window.undoManager) {
            const cutCommand = {
                execute: () => {
                    cutShapes.forEach(shape => {
                        const idx = shapes.indexOf(shape);
                        if (idx !== -1) shapes.splice(idx, 1);
                    });
                    clearSelection();
                    drawAll();
                    rebuildTracks();
                },
                undo: () => {
                    for (let i = 0; i < cutShapes.length; i++) {
                        shapes.splice(cutIndices[i], 0, cutShapes[i]);
                    }
                    drawAll();
                    rebuildTracks();
                }
            };
            window.undoManager.execute(cutCommand);
        }
        return;
    }
    if (isCtrl && e.key === 'd') {
        e.preventDefault();
        e.stopPropagation();
        const shapesToDuplicate = selectedShapes && selectedShapes.length > 0 ? [...selectedShapes] : (selectedShape ? [selectedShape] : []);
        if (shapesToDuplicate.length === 0) {
            showToast("No object selected", 'I');
            return;
        }
        const newShapes = [];
        const duplicatedShapes = [];
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
            duplicatedShapes.push(newShape);
        });
        clearSelection();
        duplicatedShapes.forEach(shape => {
            shape.selected = true;
            selectedShapes.push(shape);
        });
        selectedShape = duplicatedShapes[duplicatedShapes.length - 1];
        if (shapeManager) shapeManager.setSelectedShape(selectedShape);
        drawAll();
        rebuildTracks();
        if (window.undoManager) {
            const duplicateCommand = {
                execute: () => {
                    newShapes.forEach(shape => shapes.push(shape));
                    clearSelection();
                    newShapes.forEach(shape => {
                        shape.selected = true;
                        selectedShapes.push(shape);
                    });
                    selectedShape = newShapes[newShapes.length - 1];
                    drawAll();
                    rebuildTracks();
                },
                undo: () => {
                    newShapes.forEach(shape => {
                        const idx = shapes.indexOf(shape);
                        if (idx !== -1) shapes.splice(idx, 1);
                    });
                    clearSelection();
                    drawAll();
                    rebuildTracks();
                }
            };
            window.undoManager.execute(duplicateCommand);
        }
        return;
    }
    
    if (isCtrl && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        
        const rotationStep = isShift ? 5 : 1;
        const shapesToRotate = selectedShapes && selectedShapes.length > 0 ? selectedShapes : (selectedShape ? [selectedShape] : []);
        
        if (shapesToRotate.length === 0) return;
        
        const oldStates = shapesToRotate.map(shape => ({
            rotation: shape.rotation,
            x: shape.x,
            y: shape.y
        }));
        
        shapesToRotate.forEach(shape => {
            const delta = (e.key === 'ArrowRight' ? rotationStep : -rotationStep) * Math.PI / 180;
            
            if (shape.pivotX !== 0 || shape.pivotY !== 0) {
                const pivotWorld = shape.getPivotWorldPosition();
                
                shape.rotation += delta;
                
                const newPivotWorld = shape.getPivotWorldPosition();
                shape.x += pivotWorld.x - newPivotWorld.x;
                shape.y += pivotWorld.y - newPivotWorld.y;
            } else {
                shape.rotation += delta;
            }
        });
        
        drawAll();
        
        if (window.undoManager) {
            const rotateCommand = {
                execute: () => {
                    shapesToRotate.forEach((shape, idx) => {
                        const delta = (e.key === 'ArrowRight' ? rotationStep : -rotationStep) * Math.PI / 180;
                        if (shape.pivotX !== 0 || shape.pivotY !== 0) {
                            const pivotWorld = shape.getPivotWorldPosition();
                            shape.rotation += delta;
                            const newPivotWorld = shape.getPivotWorldPosition();
                            shape.x += pivotWorld.x - newPivotWorld.x;
                            shape.y += pivotWorld.y - newPivotWorld.y;
                        } else {
                            shape.rotation += delta;
                        }
                    });
                    drawAll();
                },
                undo: () => {
                    shapesToRotate.forEach((shape, idx) => {
                        shape.rotation = oldStates[idx].rotation;
                        shape.x = oldStates[idx].x;
                        shape.y = oldStates[idx].y;
                    });
                    drawAll();
                }
            };
            window.undoManager.execute(rotateCommand);
        }
        return;
    }
    const moveStep = isShift ? 5 : 1;
    let moved = false;
    let moveDelta = { x: 0, y: 0 };
    const shapesToMove = selectedShapes && selectedShapes.length > 0 ? selectedShapes : (selectedShape ? [selectedShape] : []);
    if (shapesToMove.length > 0) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                e.stopPropagation();
                moveDelta = { x: -moveStep, y: 0 };
                shapesToMove.forEach(shape => { shape.x += moveDelta.x; });
                moved = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                e.stopPropagation();
                moveDelta = { x: moveStep, y: 0 };
                shapesToMove.forEach(shape => { shape.x += moveDelta.x; });
                moved = true;
                break;
            case 'ArrowUp':
                e.preventDefault();
                e.stopPropagation();
                moveDelta = { x: 0, y: -moveStep };
                shapesToMove.forEach(shape => { shape.y += moveDelta.y; });
                moved = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                e.stopPropagation();
                moveDelta = { x: 0, y: moveStep };
                shapesToMove.forEach(shape => { shape.y += moveDelta.y; });
                moved = true;
                break;
        }
        if (moved) {
            drawAll();
            if (window.undoManager) {
                const oldPositions = shapesToMove.map(shape => ({ x: shape.x - moveDelta.x, y: shape.y - moveDelta.y }));
                const moveCommand = {
                    execute: () => {
                        shapesToMove.forEach((shape, idx) => {
                            shape.x = oldPositions[idx].x + moveDelta.x;
                            shape.y = oldPositions[idx].y + moveDelta.y;
                        });
                        drawAll();
                    },
                    undo: () => {
                        shapesToMove.forEach((shape, idx) => {
                            shape.x = oldPositions[idx].x;
                            shape.y = oldPositions[idx].y;
                        });
                        drawAll();
                    }
                };
                window.undoManager.execute(moveCommand);
            }
            return;
        }
    }
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
    if (isCtrl && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        selectAllShapes();
        return;
    }
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        const confirmModal = document.getElementById('confirmDialog');
        if (confirmModal && confirmModal.classList.contains('open')) {
            confirmModal.classList.remove('open');
            return;
        }
        clearSelection();
        return;
    }
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
                if (window.undoManager) {
                    const layerCommand = {
                        execute: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.push(selectedShape);
                            drawAll();
                        },
                        undo: () => {
                            shapes.splice(shapes.length - 1, 1);
                            shapes.splice(oldIndex, 0, selectedShape);
                            drawAll();
                        }
                    };
                    window.undoManager.execute(layerCommand);
                }
            }
        }
        return;
    }
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
                if (window.undoManager) {
                    const layerCommand = {
                        execute: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.unshift(selectedShape);
                            drawAll();
                        },
                        undo: () => {
                            shapes.splice(0, 1);
                            shapes.splice(oldIndex, 0, selectedShape);
                            drawAll();
                        }
                    };
                    window.undoManager.execute(layerCommand);
                }
            }
        }
        return;
    }
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
                if (window.undoManager) {
                    const layerCommand = {
                        execute: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.splice(oldIndex + 1, 0, selectedShape);
                            drawAll();
                        },
                        undo: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.splice(oldIndex, 0, selectedShape);
                            drawAll();
                        }
                    };
                    window.undoManager.execute(layerCommand);
                }
            }
        }
        return;
    }
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
                if (window.undoManager) {
                    const layerCommand = {
                        execute: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.splice(oldIndex - 1, 0, selectedShape);
                            drawAll();
                        },
                        undo: () => {
                            const idx = shapes.indexOf(selectedShape);
                            shapes.splice(idx, 1);
                            shapes.splice(oldIndex, 0, selectedShape);
                            drawAll();
                        }
                    };
                    window.undoManager.execute(layerCommand);
                }
            }
        }
        return;
    }
    if (isCtrl && isShift && e.key === 'h') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldScaleX = selectedShape.scaleX;
            selectedShape.scaleX = -(selectedShape.scaleX || 1);
            drawAll();
            if (window.undoManager) {
                const flipCommand = {
                    execute: () => {
                        selectedShape.scaleX = -(selectedShape.scaleX || 1);
                        drawAll();
                    },
                    undo: () => {
                        selectedShape.scaleX = oldScaleX;
                        drawAll();
                    }
                };
                window.undoManager.execute(flipCommand);
            }
        }
        return;
    }
    if (isCtrl && isShift && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldScaleY = selectedShape.scaleY;
            selectedShape.scaleY = -(selectedShape.scaleY || 1);
            drawAll();
            if (window.undoManager) {
                const flipCommand = {
                    execute: () => {
                        selectedShape.scaleY = -(selectedShape.scaleY || 1);
                        drawAll();
                    },
                    undo: () => {
                        selectedShape.scaleY = oldScaleY;
                        drawAll();
                    }
                };
                window.undoManager.execute(flipCommand);
            }
        }
        return;
    }
    
    if (isCtrl && e.key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldState = {
                rotation: selectedShape.rotation,
                scaleX: selectedShape.scaleX,
                scaleY: selectedShape.scaleY,
                skewX: selectedShape.skewX,
                skewY: selectedShape.skewY,
                pivotX: selectedShape.pivotX,
                pivotY: selectedShape.pivotY,
                x: selectedShape.x,
                y: selectedShape.y
            };
            
            const pivotWorld = selectedShape.getPivotWorldPosition();
            
            selectedShape.rotation = 0;
            selectedShape.scaleX = 1;
            selectedShape.scaleY = 1;
            selectedShape.skewX = 0;
            selectedShape.skewY = 0;
            selectedShape.pivotX = 0;
            selectedShape.pivotY = 0;
            
            const newPivotWorld = selectedShape.getPivotWorldPosition();
            selectedShape.x += pivotWorld.x - newPivotWorld.x;
            selectedShape.y += pivotWorld.y - newPivotWorld.y;
            
            drawAll();
            
            if (window.undoManager) {
                const resetCommand = {
                    execute: () => {
                        const oldPivotWorld = selectedShape.getPivotWorldPosition();
                        selectedShape.rotation = 0;
                        selectedShape.scaleX = 1;
                        selectedShape.scaleY = 1;
                        selectedShape.skewX = 0;
                        selectedShape.skewY = 0;
                        selectedShape.pivotX = 0;
                        selectedShape.pivotY = 0;
                        const newPivotWorld = selectedShape.getPivotWorldPosition();
                        selectedShape.x += oldPivotWorld.x - newPivotWorld.x;
                        selectedShape.y += oldPivotWorld.y - newPivotWorld.y;
                        drawAll();
                    },
                    undo: () => {
                        selectedShape.rotation = oldState.rotation;
                        selectedShape.scaleX = oldState.scaleX;
                        selectedShape.scaleY = oldState.scaleY;
                        selectedShape.skewX = oldState.skewX;
                        selectedShape.skewY = oldState.skewY;
                        selectedShape.pivotX = oldState.pivotX;
                        selectedShape.pivotY = oldState.pivotY;
                        selectedShape.x = oldState.x;
                        selectedShape.y = oldState.y;
                        drawAll();
                    }
                };
                window.undoManager.execute(resetCommand);
            }
        }
        return;
    }
    if (isCtrl && isShift && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        if (selectedShape) {
            const oldX = selectedShape.x;
            const oldY = selectedShape.y;
            selectedShape.x = canvas.width / 2;
            selectedShape.y = canvas.height / 2;
            drawAll();
            if (window.undoManager) {
                const centerCommand = {
                    execute: () => {
                        selectedShape.x = canvas.width / 2;
                        selectedShape.y = canvas.height / 2;
                        drawAll();
                    },
                    undo: () => {
                        selectedShape.x = oldX;
                        selectedShape.y = oldY;
                        drawAll();
                    }
                };
                window.undoManager.execute(centerCommand);
            }
        }
        return;
    }
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
    if (e.key === 'q' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        const btnSelectionTool = document.getElementById('btnSelectionTool');
        if (btnSelectionTool) btnSelectionTool.click();
        return;
    }
    if (e.key === 'v' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        setMode('object');
        return;
    }
    if (e.key === 'h' && !isCtrl && !isAlt) {
        e.preventDefault();
        e.stopPropagation();
        setMode('canvas');
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
    if (isCtrl && e.key === 'o') {
        e.preventDefault();
        e.stopPropagation();
        if (typeof importProject === 'function') importProject();
        return;
    }
    if (isCtrl && isShift && e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        const exportBtn = document.getElementById('btnExportAdvanced');
        if (exportBtn) exportBtn.click();
        return;
    }
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
            }
        );
        return;
    }
    if ((e.key === 'F11') || (isCtrl && isShift && e.key === 'f')) {
        e.preventDefault();
        e.stopPropagation();
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
        return;
    }
    if (isAlt && e.key === 'ArrowUp' && !isCtrl) {
        e.preventDefault();
        if (selectedShape && selectedShape.type === 'text' && shapeManager) {
            shapeManager.nextFont();
        }
        return;
    }
    if (isAlt && e.key === 'ArrowDown' && !isCtrl) {
        e.preventDefault();
        if (selectedShape && selectedShape.type === 'text' && shapeManager) {
            shapeManager.prevFont();
        }
        return;
    }
    // B - Add bookmark at current time
    if (e.key === 'b' && !isCtrl && isAlt) {
        e.preventDefault();
        e.stopPropagation();
        addBookmark(window.animationState.currentTime);
        return;
    }
    
    // Ctrl + Shift + L - Toggle Loop
    if (isCtrl && isShift && e.key === 'l') {
        e.preventDefault();
        e.stopPropagation();
        toggleLoop();
        return;
    }
});
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
    
    if (original.type === 'drawing') {
        if (original.strokesData) copy.strokesData = JSON.parse(JSON.stringify(original.strokesData));
        if (original.strokeFillColors) copy.strokeFillColors = [...original.strokeFillColors];
        copy.isDrawing = true;
        copy.finished = true;
        copy.editable = false;
    }
    
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

function cloneShapeForUndo(original) {
    const clone = {
        type: original.type,
        x: original.x,
        y: original.y,
        size: original.size,
        rotation: original.rotation,
        scaleX: original.scaleX,
        scaleY: original.scaleY,
        skewX: original.skewX,
        skewY: original.skewY,
        pivotX: original.pivotX,
        pivotY: original.pivotY,
        opacity: original.opacity,
        color: original.color,
        borderWidth: original.borderWidth,
        borderColor: original.borderColor,
        shadowColor: original.shadowColor,
        shadowBlur: original.shadowBlur,
        shadowOffsetX: original.shadowOffsetX,
        shadowOffsetY: original.shadowOffsetY,
        shadowOpacity: original.shadowOpacity
    };
    
    if (original.type === 'drawing' && original.strokesData) {
        clone.strokesData = JSON.parse(JSON.stringify(original.strokesData));
        clone.strokeFillColors = original.strokeFillColors ? [...original.strokeFillColors] : [];
    }
    
    if (original.points) {
        clone.points = JSON.parse(JSON.stringify(original.points));
    }
    
    if (original.text) {
        clone.text = original.text;
        clone.fontSize = original.fontSize;
        clone.fontFamily = original.fontFamily;
    }
    
    return clone;
}

function restoreShapeFromClone(clone) {
    const shape = new Shape(clone.type, clone.x, clone.y, clone.size);
    Object.assign(shape, clone);
    
    if (clone.type === 'drawing' && clone.strokesData) {
        shape.strokesData = JSON.parse(JSON.stringify(clone.strokesData));
        shape.strokeFillColors = clone.strokeFillColors ? [...clone.strokeFillColors] : [];
        shape.isDrawing = true;
        shape.finished = true;
    }
    
    return shape;
}
function updateUndoRedoButtons() {
    const btnUndo = document.getElementById('btnUndo');
    const btnRedo = document.getElementById('btnRedo');
    if (!window.undoManager) return;
    const info = window.undoManager.getStackInfo();
    if (btnUndo) btnUndo.disabled = info.undo === 0;
    if (btnRedo) btnRedo.disabled = info.redo === 0;
}

function selectAllShapes() {
    if (shapes.length === 0) {
        showToast("No objects to select", 'I');
        return;
    }
    for (let shape of shapes) {
        shape.selected = false;
    }
    selectedShapes = [];
    for (let shape of shapes) {
        shape.selected = true;
        selectedShapes.push(shape);
    }
    if (selectedShapes.length > 0) {
        selectedShape = selectedShapes[selectedShapes.length - 1];
        if (shapeManager) shapeManager.setSelectedShape(selectedShape);
    }
    
    drawAll();
    rebuildTracks();
}
