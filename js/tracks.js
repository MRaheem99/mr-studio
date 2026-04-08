function rebuildTracks() {
    trackLabels.innerHTML = "";
    timelineTracks.innerHTML = "";
    
    function buildTrackItem(obj, depth = 0) {
        // Skip if object is inside a group (parentGroup exists)
        if (obj.parentGroup) {
            return;
        }
        
        const label = document.createElement("div");
        label.className = "track-label";
        label.style.paddingLeft = `${10 + depth * 20}px`;
        
        // Check if this object is selected
        const isSelected = (obj === selectedShape) || (selectedShapes && selectedShapes.includes(obj));
        if (isSelected) {
            label.classList.add("active");
        }
        
        if (obj.type === "group") {
            const toggle = document.createElement("span");
            toggle.innerHTML = obj.expanded ? "▼ " : "▶ ";
            toggle.style.cursor = "pointer";
            toggle.style.marginRight = "5px";
            toggle.onclick = (e) => {
                e.stopPropagation();
                obj.expanded = !obj.expanded;
                rebuildTracks();
            };
            label.appendChild(toggle);
            label.appendChild(document.createTextNode(`${obj.name} (${obj.children.length})`));
        } else {
            // Get display name for shape
            let displayName = obj.type;
            if (obj.type === 'text') {
                displayName = `Text: "${obj.text.substring(0, 15)}${obj.text.length > 15 ? '...' : ''}"`;
            } else if (obj.type === 'image') {
                displayName = 'Image';
            } else if (obj.type === 'drawing') {
                displayName = 'Drawing';
            }
            label.appendChild(document.createTextNode(displayName));
        }
        
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✎";
        editBtn.style.marginLeft = "auto";
        editBtn.style.cursor = "pointer";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            if (shapeManager) {
                shapeManager.setSelectedShape(obj);
                shapeManager.openModal();
            }
        };
        label.appendChild(editBtn);
        
        label.onclick = (e) => {
            e.stopPropagation();
            
            // Clear all selections first
            for (let shape of shapes) {
                shape.selected = false;
            }
            selectedShapes = [];
            
            // Select this object
            obj.selected = true;
            selectedShape = obj;
            selectedShapes = [obj];
            
            if (shapeManager) {
                shapeManager.setSelectedShape(obj);
            }
            
            if (typeof updateSelectionDisplay === 'function') {
                updateSelectionDisplay();
            }
            
            drawAll();
            rebuildTracks();
        };
        
        trackLabels.appendChild(label);
        
        const row = document.createElement("div");
        row.className = "track-row";
        if (isSelected) {
            row.classList.add("active");
        }
        timelineTracks.appendChild(row);
        
        row.addEventListener("click", (e) => {
            if (timelineDragging) return;
            if (e.ctrlKey || e.metaKey) return;
            if (e.target.classList.contains("keyframe")) return;
            
            // Select this object when clicking on its track row
            for (let shape of shapes) {
                shape.selected = false;
            }
            selectedShapes = [];
            
            obj.selected = true;
            selectedShape = obj;
            selectedShapes = [obj];
            
            if (shapeManager) {
                shapeManager.setSelectedShape(obj);
            }
            
            if (typeof updateSelectionDisplay === 'function') {
                updateSelectionDisplay();
            }
            
            drawAll();
            rebuildTracks();
            
            // Then add keyframe
            const wrapperRect = timelineTracksWrapper.getBoundingClientRect();
            const mouseX = e.pageX - wrapperRect.left - window.scrollX;
            const timelineX = mouseX + timelineTracksWrapper.scrollLeft;
            let time = timelineX / pixelsPerSecond;
            time = Math.max(0, time);
            const snap = 0.1;
            time = Math.round(time / snap) * snap;
            
            const state = shapeManager.captureState();
            
            shapeManager.undoManager.execute(
                new KeyframeCommand(
                    obj,
                    "add",
                    -1,
                    { time: parseFloat(time.toFixed(2)), state },
                    () => {
                        rebuildTracks();
                        drawAll();
                    },
                    () => shapeManager.recalculateGlobalDuration()
                )
            );
        });
        
        // Touch support for row
        row.addEventListener("touchstart", (e) => {
            if (e.target.classList.contains("keyframe")) return;
            
            // Select this object
            for (let shape of shapes) {
                shape.selected = false;
            }
            selectedShapes = [];
            
            obj.selected = true;
            selectedShape = obj;
            selectedShapes = [obj];
            
            if (shapeManager) {
                shapeManager.setSelectedShape(obj);
            }
            
            if (typeof updateSelectionDisplay === 'function') {
                updateSelectionDisplay();
            }
            
            drawAll();
            rebuildTracks();
            
            const wrapperRect = timelineTracksWrapper.getBoundingClientRect();
            const touchX = e.touches[0].pageX - wrapperRect.left;
            const timelineX = touchX + timelineTracksWrapper.scrollLeft;
            let time = timelineX / pixelsPerSecond;
            time = Math.max(0, time);
            const snap = 0.1;
            time = Math.round(time / snap) * snap;
            
            const state = shapeManager.captureState();
            
            shapeManager.undoManager.execute(
                new KeyframeCommand(
                    obj,
                    "add",
                    -1,
                    { time: parseFloat(time.toFixed(2)), state },
                    () => {
                        rebuildTracks();
                        drawAll();
                    },
                    () => shapeManager.recalculateGlobalDuration()
                )
            );
        });
        
        // Add keyframes
        if (obj.keyframes) {
            obj.keyframes.forEach((kf, kfIndex) => {
                const dot = document.createElement("div");
                dot.className = "keyframe";
                dot.style.left = (kf.time * pixelsPerSecond) + "px";
                
                if (shapeManager &&
                    shapeManager.selectedShape === obj &&
                    shapeManager.editingKeyframeIndex === kfIndex) {
                    dot.classList.add("active");
                }
                
                dot.addEventListener("click", (e) => {
                    e.stopPropagation();
                    
                    // Select this object first
                    for (let shape of shapes) {
                        shape.selected = false;
                    }
                    selectedShapes = [];
                    
                    obj.selected = true;
                    selectedShape = obj;
                    selectedShapes = [obj];
                    
                    if (shapeManager) {
                        shapeManager.setSelectedShape(obj);
                        shapeManager.openKeyframes();
                        shapeManager.enterEditMode(kfIndex);
                        shapeManager.scrollKeyframeIntoView(kfIndex);
                    }
                    
                    if (typeof updateSelectionDisplay === 'function') {
                        updateSelectionDisplay();
                    }
                    
                    drawAll();
                    rebuildTracks();
                });
                
                dot.addEventListener("touchstart", (e) => {
                    e.stopPropagation();
                    
                    for (let shape of shapes) {
                        shape.selected = false;
                    }
                    selectedShapes = [];
                    
                    obj.selected = true;
                    selectedShape = obj;
                    selectedShapes = [obj];
                    
                    if (shapeManager) {
                        shapeManager.setSelectedShape(obj);
                        shapeManager.enterEditMode(kfIndex);
                        shapeManager.openKeyframes();
                    }
                    
                    drawAll();
                    rebuildTracks();
                });
                
                row.appendChild(dot);
            });
        }
        
        // Recursively build children for groups (only if expanded)
        if (obj.type === "group" && obj.expanded && obj.children) {
            obj.children.forEach(child => buildTrackItem(child, depth + 1));
        }
    }
    
    shapes.forEach(shape => buildTrackItem(shape, 0));
    updatePlayhead();
}

function captureObjectState(shape) {
    if(!shape) return null;
    return {
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation,
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
        skewX: shape.skewX,
        skewY: shape.skewY,
        pivotX: shape.pivotX,
        pivotY: shape.pivotY,
        color: shape.color,
        opacity: shape.opacity,
        borderWidth: shape.borderWidth,
        borderColor: shape.borderColor,
        borderOffset: shape.borderOffset,
        borderBlur: shape.borderBlur,
        cornerRadius: shape.cornerRadius,
        shadowColor: shape.shadowColor,
        shadowBlur: shape.shadowBlur,
        shadowOffsetX: shape.shadowOffsetX,
        shadowOffsetY: shape.shadowOffsetY,
        shadowOpacity: shape.shadowOpacity,
        text: shape.text,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        filterBrightness: shape.filterBrightness,
        filterContrast: shape.filterContrast,
        filterSaturation: shape.filterSaturation,
        filterBlur: shape.filterBlur,
        bgImage: shape.bgImage,
        bgFit: shape.bgFit,
        bgOffsetX: shape.bgOffsetX,
        bgOffsetY: shape.bgOffsetY,
        bgScale: shape.bgScale,
        points: shape.points ? shape.points.map(p => ({
            x: p.x,
            y: p.y,
            in: {
                ...p.in
            },
            out: {
                ...p.out
            },
            curve: p.curve
        })) : null
    };
}