function rebuildTracks() {
    trackLabels.innerHTML = "";
    timelineTracks.innerHTML = "";
    function buildTrackItem(obj, depth = 0) {
        if (obj.parentGroup) return;
        const label = document.createElement("div");
        label.className = "track-label";
        label.style.paddingLeft = `${10 + depth * 20}px`;
        const isSelected = (obj === selectedShape) || (selectedShapes && selectedShapes.includes(obj));
        if (isSelected) {
            label.classList.add("active");
        }
        const eyeBtn = document.createElement("span");
        const isSoloActive = (soloEditObject === obj);
        eyeBtn.className = "track-eye-btn";
        eyeBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        eyeBtn.style.cursor = "pointer";
        eyeBtn.style.marginRight = "8px";
        eyeBtn.style.color = isSoloActive ? "#00d4ff" : "#888";
        eyeBtn.title = isSoloActive ? "Exit solo mode" : "Solo edit (lock all others)";
        eyeBtn.onclick = (e) => {
            e.stopPropagation();
            if (soloEditObject === obj) {
                soloEditMode = false;
                soloEditObject = null;
                eyeBtn.style.color = "#888";
            } else {
                selectedShapes = [];
                soloEditMode = true;
                soloEditObject = obj;
                rebuildTracks();
                eyeBtn.style.color = "#00d4ff";
                soloEditObject.selected = true;
                selectedShape = soloEditObject;
                selectedShapes = [soloEditObject];
            }
            drawAll();
            updateSoloModeStatus();
        };
        label.appendChild(eyeBtn);
        let tle = "Edit";
        const nameSpan = document.createElement("button");
        const displayName = getObjectName(obj);
        nameSpan.textContent = displayName;
        nameSpan.style.cssText = `
            background: transparent;
            text-align: left;
            border: none;
            color: var(--accent);
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 0.8rem;
            width: 100px;
            cursor: pointer;
        `;
        nameSpan.onclick = (e) => {
            e.stopPropagation();
            editObjectName(obj, nameSpan);
        };
        label.appendChild(nameSpan);
        if (obj.type === "group") {
            tle = "Edit Group";
            const toggle = document.createElement("span");
            toggle.innerHTML = obj.expanded ? " ▼" : " ▶";
            toggle.style.cursor = "pointer";
            toggle.style.marginLeft = "5px";
            toggle.onclick = (e) => {
                e.stopPropagation();
                obj.expanded = !obj.expanded;
                rebuildTracks();
            };
            label.appendChild(toggle);
        } else {
            tle = "Edit Object";
        }
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✎";
        editBtn.style.marginLeft = "auto";
        editBtn.style.cursor = "pointer";
        editBtn.style.background = "transparent";
        editBtn.style.color = "#eee";
        editBtn.style.padding = "0 2px";
        editBtn.title = tle;
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
            if (soloEditMode && soloEditObject !== obj) {
                return;
            }
            for (let shape of shapes) {
                shape.selected = false;
            }
            selectedShapes = [];
            obj.selected = true;
            selectedShape = obj;
            selectedShapes = [obj];
            if (shapeManager) shapeManager.setSelectedShape(obj);
            if (typeof updateSelectionDisplay === 'function') updateSelectionDisplay();
            drawAll();
            rebuildTracks();
        };
        trackLabels.appendChild(label);
        const row = document.createElement("div");
        row.className = "track-row";
        if (isSelected) row.classList.add("active");
        timelineTracks.appendChild(row);
        row.addEventListener("click", (e) => {
            if (timelineDragging) return;
            if (e.ctrlKey || e.metaKey) return;
            if (e.target.classList.contains("keyframe")) return;
            if (soloEditMode && soloEditObject !== obj) {
                showToast(`Only "${getObjectName(soloEditObject)}" is editable in solo mode`, 'I');
                return;
            }
            for (let shape of shapes) {
                shape.selected = false;
            }
            selectedShapes = [];
            obj.selected = true;
            selectedShape = obj;
            selectedShapes = [obj];
            if (shapeManager) shapeManager.setSelectedShape(obj);
            if (typeof updateSelectionDisplay === 'function') updateSelectionDisplay();
            drawAll();
            rebuildTracks();
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
                    "add", -1, { time: parseFloat(time.toFixed(2)), state },
                    () => {
                        rebuildTracks();
                        drawAll();
                    },
                    () => shapeManager.recalculateGlobalDuration()
                )
            );
        });
        if (obj.keyframes) {
            obj.keyframes.forEach((kf, kfIndex) => {
                const dot = document.createElement("div");
                dot.className = "keyframe";
                dot.style.left = (kf.time * pixelsPerSecond) + "px";
                if (shapeManager && shapeManager.selectedShape === obj && shapeManager.editingKeyframeIndex === kfIndex) {
                    dot.classList.add("active");
                }
                dot.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (soloEditMode && soloEditObject !== obj) {
                        showToast(`Only "${getObjectName(soloEditObject)}" is editable in solo mode`, 'I');
                        return;
                    }
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
                    }
                    drawAll();
                    rebuildTracks();
                });
                row.appendChild(dot);
            });
        }
        if (obj.type === "group" && obj.expanded && obj.children) {
            obj.children.forEach(child => buildTrackItem(child, depth + 1));
        }
    }
    shapes.forEach(shape => buildTrackItem(shape, 0));
    updatePlayhead();
}
function getObjectName(obj) {
    if (obj.customName) return obj.customName;
    if (obj.name) return obj.name;
    return `${obj.type}_${shapes.indexOf(obj) + 1}`;
}
function editObjectName(obj, nameSpan) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = getObjectName(obj);
    input.style.cssText = `
        background: var(--bg-panel);
        border: 1px solid var(--accent);
        color: var(--text-main);
        padding: 2px 5px;
        border-radius: 4px;
        font-size: 0.8rem;
        width: 100px;
    `;
    nameSpan.style.display = "none";
    nameSpan.parentNode.insertBefore(input, nameSpan);
    input.focus();
    const saveName = () => {
        const newName = input.value.trim();
        if (newName) {
            if (obj.type === "group") {
                obj.name = newName;
            } else {
                obj.customName = newName;
            }
            nameSpan.textContent = newName;
            if (shapeManager && shapeManager.selectedShape === obj) {
                shapeManager.syncUI();
            }
            showToast(`Renamed to "${newName}"`, 'S');
        }
        input.remove();
        nameSpan.style.display = "inline";
    };
    input.addEventListener("blur", saveName);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveName();
    });
}
function captureObjectState(shape) {
    if (!shape) return null;
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
