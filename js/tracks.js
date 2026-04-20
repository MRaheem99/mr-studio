function getSnappedTimeWithBookmark(time, snapThreshold = 0.05) {
    if (!window.bookmarks || window.bookmarks.length === 0) {
        return { time: time, snapped: false, bookmark: null };
    }

    let nearestBookmark = null;
    let minDistance = snapThreshold;

    for (let bookmark of window.bookmarks) {
        const distance = Math.abs(bookmark.time - time);
        if (distance < minDistance) {
            minDistance = distance;
            nearestBookmark = bookmark;
        }
    }

    if (nearestBookmark) {
        return { time: nearestBookmark.time, snapped: true, bookmark: nearestBookmark };
    }
    return { time: time, snapped: false, bookmark: null };
}

function initTimelineHover() {
    if (!timelineTracksWrapper) return;

    timelineTracksWrapper.style.position = 'relative';

    if (!timelineHoverLineRuler) {
        timelineHoverLineRuler = document.createElement('div');
        timelineHoverLineRuler.style.cssText = `
            position: absolute;
            top: 0;
            bottom:0;
            width: 2px;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            z-index: 200;
            display: none;
        `;
        rulerCntainer.appendChild(timelineHoverLineRuler);
    }
    if (!timelineHoverLineWrapper) {
        timelineHoverLineWrapper = document.createElement('div');
        timelineHoverLineWrapper.style.cssText = `
            position: absolute;
            top: 0;
            bottom:0;
            width: 2px;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            z-index: 200;
            display: none;
        `;
        timelineTracksWrapper.appendChild(timelineHoverLineWrapper);
    }

    if (!timelineHoverTooltip) {
        timelineHoverTooltip = document.createElement('div');
        timelineHoverTooltip.style.cssText = `
            position: absolute;
            bottom: 30px;
            background: rgba(0, 0, 0, 0.85);
            color: #00d4ff;
            font-size: 10px;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            pointer-events: none;
            z-index: 201;
            white-space: nowrap;
            border: 1px solid rgba(0, 212, 255, 0.3);
            display: none;
        `;
        timelineTracksWrapper.appendChild(timelineHoverTooltip);
    }

    function updateHoverLine(clientX) {
        const tracksContainer = timelineTracks;
        if (!tracksContainer) return;

        const wrapperRect = timelineTracksWrapper.getBoundingClientRect();

        let mouseX = clientX - wrapperRect.left;

        if (mouseX < 0 || mouseX > wrapperRect.width) {
            timelineHoverLineRuler.style.display = 'none';
            timelineHoverLineWrapper.style.display = 'none';
            timelineHoverTooltip.style.display = 'none';
            return;
        }

        lastMouseX = mouseX;

        const scrollLeft = timelineTracksWrapper.scrollLeft;
        const absoluteX = scrollLeft + mouseX;
        let timeAtMouse = absoluteX / pixelsPerSecond;
        const duration = window.animationState ?.animationDuration || 60;
        const clampedTime = Math.max(0, Math.min(timeAtMouse, duration));

        timelineHoverLineRuler.style.display = 'block';
        timelineHoverLineRuler.style.left = (mouseX) + 'px';
        timelineHoverLineWrapper.style.display = 'block';
        timelineHoverLineWrapper.style.left = (absoluteX) + 'px';

        let isNearBookmark = false;
        let bookmarkName = '';
        let bookmarkTime = null;

        if (typeof bookmarks !== 'undefined' && bookmarks && bookmarks.length > 0) {
            for (let bookmark of bookmarks) {
                const bookmarkX = (bookmark.time * pixelsPerSecond) - scrollLeft;
                const distanceToBookmark = Math.abs(bookmarkX - mouseX);

                if (distanceToBookmark < 5) {
                    isNearBookmark = true;
                    bookmarkName = bookmark.name || 'Bookmark';
                    bookmarkTime = bookmark.time;
                    break;
                }
            }
        }

        if (isNearBookmark) {
            timelineHoverLineRuler.style.backgroundColor = '#ffcc00';
            timelineHoverLineRuler.style.width = '2px';
            timelineHoverLineWrapper.style.backgroundColor = '#ffcc00';
            timelineHoverLineWrapper.style.width = '2px';
            timelineHoverTooltip.textContent = `${bookmarkName}`;
        } else {
            timelineHoverLineRuler.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            timelineHoverLineRuler.style.width = '1px';
            timelineHoverLineWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            timelineHoverLineWrapper.style.width = '1px';
            timelineHoverTooltip.textContent = `${clampedTime.toFixed(2)}s`;
        }

        timelineHoverTooltip.style.display = 'block';
        let tooltipLeft = absoluteX + 10;
        const maxLeft = timelineTracksWrapper.scrollLeft + wrapperRect.width - 100;
        if (tooltipLeft > maxLeft) {
            tooltipLeft = timelineTracksWrapper.scrollLeft + wrapperRect.width - 100;
        }
        timelineHoverTooltip.style.left = tooltipLeft + 'px'; //Math.max(timelineTracksWrapper.scrollLeft + 5, tooltipLeft) + 'px';
    }

    timelineTracksWrapper.addEventListener('scroll', () => {
        if (lastMouseX !== null && timelineHoverLineRuler.style.display === 'block') {
            const tracksContainer = timelineTracks;
            if (!tracksContainer) return;

            const scrollLeft = timelineTracksWrapper.scrollLeft;
            const absoluteX = scrollLeft + lastMouseX;
            let timeAtMouse = absoluteX / pixelsPerSecond;
            const duration = window.animationState ?.duration || 60;
            const clampedTime = Math.max(0, Math.min(timeAtMouse, duration));

            let isNearBookmark = false;
            let bookmarkName = '';
            let bookmarkTime = null;

            if (typeof bookmarks !== 'undefined' && bookmarks && bookmarks.length > 0) {
                for (let bookmark of bookmarks) {
                    const bookmarkX = (bookmark.time * pixelsPerSecond) - scrollLeft;
                    const distanceToBookmark = Math.abs(bookmarkX - lastMouseX);

                    if (distanceToBookmark < 5) {
                        isNearBookmark = true;
                        bookmarkName = bookmark.name || 'Bookmark';
                        bookmarkTime = bookmark.time;
                        break;
                    }
                }
            }

            if (isNearBookmark) {
                timelineHoverTooltip.textContent = `${bookmarkName}`;
                timelineHoverLineRuler.style.backgroundColor = '#ffcc00';
                timelineHoverLineRuler.style.width = '2px';
                timelineHoverLineWrapper.style.backgroundColor = '#ffcc00';
                timelineHoverLineWrapper.style.width = '2px';
            } else {
                timelineHoverTooltip.textContent = `${clampedTime.toFixed(2)}s`;
                timelineHoverLineRuler.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                timelineHoverLineRuler.style.width = '1px';
                timelineHoverLineWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                timelineHoverLineWrapper.style.width = '1px';
            }
        }
    });

    timelineTracksWrapper.addEventListener('mousemove', (e) => {
        updateHoverLine(e.clientX);
    });
    timelineTracksWrapper.addEventListener('mouseleave', () => {
        timelineHoverLineRuler.style.display = 'none';
        timelineHoverLineWrapper.style.display = 'none';
        timelineHoverTooltip.style.display = 'none';
        lastMouseX = null;
    });

    timelineTracksWrapper.addEventListener('mouseleave', () => {
        timelineHoverLineRuler.style.display = 'none';
        timelineHoverLineWrapper.style.display = 'none';
        timelineHoverTooltip.style.display = 'none';
        lastMouseX = null;
    });
}

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
            let rawTime = timelineX / pixelsPerSecond;

            let finalTime = rawTime;
            let snappedToBookmark = null;

            if (typeof bookmarks !== 'undefined' && bookmarks && bookmarks.length > 0) {
                let closestBookmark = null;
                let closestDistance = 0.05;

                for (let i = 0; i < bookmarks.length; i++) {
                    const bookmark = bookmarks[i];
                    const distance = Math.abs(bookmark.time - rawTime);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestBookmark = bookmark;
                    }
                }

                if (closestBookmark) {
                    finalTime = closestBookmark.time;
                    snappedToBookmark = closestBookmark;
                    console.log(`Snapped to bookmark: ${closestBookmark.name} at ${closestBookmark.time}s (distance: ${closestDistance}s)`);
                }
            }

            const state = shapeManager.captureState();
            shapeManager.undoManager.execute(
                new KeyframeCommand(
                    obj,
                    "add", -1, { time: parseFloat(finalTime.toFixed(2)), state },
                    () => {
                        rebuildTracks();
                        drawAll();
                    },
                    () => shapeManager.recalculateGlobalDuration()
                )
            );
        });

        row.addEventListener("touchstart", (e) => {
            if (e.target.classList.contains("keyframe")) return;

            const wrapperRect = timelineTracksWrapper.getBoundingClientRect();
            const touchX = e.touches[0].pageX - wrapperRect.left;
            const timelineX = touchX + timelineTracksWrapper.scrollLeft;
            let rawTime = timelineX / pixelsPerSecond;

            rawTime = Math.max(0, Math.min(rawTime, window.animationState.duration));

            let finalTime = rawTime;
            let snappedToBookmark = null;

            if (typeof bookmarks !== 'undefined' && bookmarks && bookmarks.length > 0) {
                let closestBookmark = null;
                let closestDistance = 0.05;

                for (let i = 0; i < bookmarks.length; i++) {
                    const bookmark = bookmarks[i];
                    const distance = Math.abs(bookmark.time - rawTime);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestBookmark = bookmark;
                    }
                }

                if (closestBookmark) {
                    finalTime = closestBookmark.time;
                    snappedToBookmark = closestBookmark;
                }
            }

            const state = shapeManager.captureState();

            shapeManager.undoManager.execute(
                new KeyframeCommand(
                    obj,
                    "add", -1, { time: parseFloat(finalTime.toFixed(4)), state },
                    () => {
                        rebuildTracks();
                        drawAll();
                        shapeManager.recalculateGlobalDuration();
                    },
                    () => shapeManager.recalculateGlobalDuration()
                )
            );
        });

        row.addEventListener("contextmenu", (e) => {
            if (e.target.classList.contains("keyframe")) return;

            e.preventDefault();
            e.stopPropagation();

            if (!copiedKeyframe) {
                showToast("No keyframe copied. Right-click a keyframe and select 'Copy Keyframe' first", 'I');
                return;
            }

            const wrapperRect = timelineTracksWrapper.getBoundingClientRect();
            const mouseX = e.pageX - wrapperRect.left - window.scrollX;
            const timelineX = mouseX + timelineTracksWrapper.scrollLeft;
            let rawTime = timelineX / pixelsPerSecond;
            const time = Math.max(0, Math.min(rawTime, window.animationState.duration));

            showConfirmDialog(
                "Paste Keyframe",
                `Paste copied keyframe at ${time.toFixed(2)}s?`,
                () => {
                    pasteKeyframe(obj, time);
                },
                () => {
                    showToast("Paste cancelled", 'I');
                }
            );
        });

        if (obj.keyframes) {
            obj.keyframes.forEach((kf, kfIndex) => {
                const dot = document.createElement("div");
                dot.className = "keyframe";
                dot.setAttribute('data-time', kf.time);
                dot.style.left = (kf.time * pixelsPerSecond) + "px";

                dot.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showKeyframeContextMenu(obj, kfIndex, e.clientX, e.clientY);
                });

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

function copyKeyframe(shape, keyframeIndex) {
    const keyframe = shape.keyframes[keyframeIndex];
    if (!keyframe) {
        showToast("No keyframe to copy", 'E');
        return false;
    }

    copiedKeyframe = {
        time: keyframe.time,
        state: JSON.parse(JSON.stringify(keyframe.state)),
        shapeType: shape.type,
        shapeId: shape.id || Date.now() + Math.random()
    };
    copiedKeyframeSourceShape = shape;

    showToast(`✅ Keyframe at ${keyframe.time.toFixed(2)}s copied`, 'S');
    return true;
}

function pasteKeyframe(targetShape, targetTime) {
    if (!copiedKeyframe) {
        showToast("No keyframe copied. Right-click a keyframe and select 'Copy Keyframe' first", 'I');
        return false;
    }

    const existing = targetShape.keyframes.find(kf => Math.abs(kf.time - targetTime) < 0.01);
    if (existing) {
        showConfirmDialog(
            "Keyframe Exists",
            `A keyframe already exists at ${targetTime.toFixed(2)}s. Do you want to replace it?`,
            () => {
                const index = targetShape.keyframes.findIndex(kf => Math.abs(kf.time - targetTime) < 0.01);
                if (index !== -1) {
                    const oldState = targetShape.keyframes[index].state;
                    const newState = JSON.parse(JSON.stringify(copiedKeyframe.state));

                    if (shapeManager && shapeManager.undoManager) {
                        shapeManager.undoManager.execute(
                            new KeyframeCommand(
                                targetShape,
                                'update',
                                index, { oldState: oldState, newState: newState },
                                () => {
                                    if (typeof rebuildTracks === 'function') rebuildTracks();
                                    if (typeof drawAll === 'function') drawAll();
                                    if (shapeManager) shapeManager.recalculateGlobalDuration();
                                },
                                () => {
                                    if (shapeManager) shapeManager.recalculateGlobalDuration();
                                }
                            )
                        );
                    } else {
                        targetShape.keyframes[index].state = newState;
                        if (typeof rebuildTracks === 'function') rebuildTracks();
                        if (typeof drawAll === 'function') drawAll();
                    }
                    showToast(`📋 Keyframe replaced at ${targetTime.toFixed(2)}s`, 'S');
                }
            },
            () => {
                showToast("Paste cancelled", 'I');
            }
        );
        return false;
    }

    const newState = JSON.parse(JSON.stringify(copiedKeyframe.state));

    if (newState.pivotWorldX !== undefined && newState.pivotWorldY !== undefined) {

    }

    if (shapeManager && shapeManager.undoManager) {
        shapeManager.undoManager.execute(
            new KeyframeCommand(
                targetShape,
                'add', -1, { time: parseFloat(targetTime.toFixed(2)), state: newState },
                () => {
                    if (typeof rebuildTracks === 'function') rebuildTracks();
                    if (typeof drawAll === 'function') drawAll();
                    if (shapeManager) shapeManager.recalculateGlobalDuration();
                },
                () => {
                    if (shapeManager) shapeManager.recalculateGlobalDuration();
                }
            )
        );
    } else {
        targetShape.keyframes.push({ time: parseFloat(targetTime.toFixed(2)), state: newState });
        targetShape.keyframes.sort((a, b) => a.time - b.time);
        if (typeof rebuildTracks === 'function') rebuildTracks();
        if (typeof drawAll === 'function') drawAll();
        if (shapeManager) shapeManager.recalculateGlobalDuration();
    }

    showToast(`📋 Keyframe pasted at ${targetTime.toFixed(2)}s`, 'S');
    return true;
}

function showKeyframeContextMenu(shape, keyframeIndex, clientX, clientY) {
    const keyframe = shape.keyframes[keyframeIndex];
    if (!keyframe) return;

    const existingMenu = document.getElementById('keyframeContextMenu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'keyframeContextMenu';
    menu.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY}px;
        background: #1e1e2e;
        border: 1px solid #333;
        border-radius: 6px;
        padding: 5px 0;
        min-width: 160px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    `;

    const menuItems = [
        { label: '📋 Copy Keyframe', icon: 'fa-copy', action: () => copyKeyframe(shape, keyframeIndex) },
        {
            label: '✂️ Cut Keyframe',
            icon: 'fa-cut',
            action: () => {
                copyKeyframe(shape, keyframeIndex);
                // Delete the keyframe after copying
                if (shapeManager && shapeManager.undoManager) {
                    shapeManager.undoManager.execute(
                        new KeyframeCommand(
                            shape,
                            'delete',
                            keyframeIndex,
                            keyframe,
                            () => {
                                if (typeof rebuildTracks === 'function') rebuildTracks();
                                if (typeof drawAll === 'function') drawAll();
                                if (shapeManager) shapeManager.recalculateGlobalDuration();
                            },
                            () => {
                                if (shapeManager) shapeManager.recalculateGlobalDuration();
                            }
                        )
                    );
                } else {
                    shape.keyframes.splice(keyframeIndex, 1);
                    if (typeof rebuildTracks === 'function') rebuildTracks();
                    if (typeof drawAll === 'function') drawAll();
                }
                showToast(`✂️ Keyframe cut at ${keyframe.time.toFixed(2)}s`, 'S');
            }
        },
        {
            label: '🗑️ Delete Keyframe',
            icon: 'fa-trash',
            action: () => {
                if (shapeManager && shapeManager.undoManager) {
                    shapeManager.undoManager.execute(
                        new KeyframeCommand(
                            shape,
                            'delete',
                            keyframeIndex,
                            keyframe,
                            () => {
                                if (typeof rebuildTracks === 'function') rebuildTracks();
                                if (typeof drawAll === 'function') drawAll();
                                if (shapeManager) shapeManager.recalculateGlobalDuration();
                            },
                            () => {
                                if (shapeManager) shapeManager.recalculateGlobalDuration();
                            }
                        )
                    );
                } else {
                    shape.keyframes.splice(keyframeIndex, 1);
                    if (typeof rebuildTracks === 'function') rebuildTracks();
                    if (typeof drawAll === 'function') drawAll();
                }
                showToast(`🗑️ Keyframe at ${keyframe.time.toFixed(2)}s deleted`, 'S');
            }
        },
        { divider: true },
        {
            label: copiedKeyframe ? '📌 Paste Keyframe' : '📌 Paste Keyframe (No keyframe copied)',
            icon: 'fa-paste',
            disabled: !copiedKeyframe,
            action: () => {
                if (copiedKeyframe) {
                    pasteKeyframe(shape, keyframe.time);
                } else {
                    showToast("No keyframe copied. Right-click a keyframe and select 'Copy Keyframe' first", 'I');
                }
            }
        },
        { divider: true },
        { label: '❌ Cancel', icon: 'fa-times', action: () => menu.remove() }
    ];

    menuItems.forEach(item => {
        if (item.divider) {
            const divider = document.createElement('hr');
            divider.style.cssText = 'margin: 5px 0; border-color: #333;';
            menu.appendChild(divider);
            return;
        }

        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 8px 15px;
            cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
            color: ${item.disabled ? '#666' : '#e0e0e0'};
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            transition: background 0.2s;
        `;

        if (!item.disabled) {
            menuItem.onmouseenter = () => {
                menuItem.style.background = 'rgba(0, 212, 255, 0.2)';
            };
            menuItem.onmouseleave = () => {
                menuItem.style.background = 'transparent';
            };
            menuItem.onclick = (e) => {
                e.stopPropagation();
                item.action();
                menu.remove();
            };
        }

        menuItem.innerHTML = `<i class="fa-solid ${item.icon}" style="width: 16px;"></i> ${item.label}`;
        menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('contextmenu', closeMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
        document.addEventListener('contextmenu', closeMenu);
    }, 0);
}
