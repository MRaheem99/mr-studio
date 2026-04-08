class ShapeManager {
    constructor(shapesArray, redrawCallback, getSettingsCallback, updateDurationCallback) {
        this.shapes = shapesArray;
        this.redraw = redrawCallback;
        this.getSettings = getSettingsCallback;
        this.updateDuration = updateDurationCallback;
        this.selectedShape = null;
        this.modal = document.getElementById('manipulateModal');
        this.popupTitle = document.getElementById('manipulateTitle');
        this.openBtn = document.getElementById('btnManipulate');
        this.closeBtn = document.getElementById('closeManipulateBtn');
        this.objListModal = document.getElementById('objectsListModal');
        this.objListOpenBtn = document.getElementById('btnObjectsList');
        this.objListCloseBtn = document.getElementById('closeObjListBtn');
        this.objListContainer = document.getElementById('objectsListContainer');
        this.kfModal = document.getElementById('objectManageModal');
        this.kfOpenBtn = document.getElementById('btnObjectManage');
        this.kfCloseBtn = document.getElementById('closeObjManageBtn');
        this.kfListContainer = document.getElementById('keyframeList');
        this.addKfBtn = document.getElementById('btnAddKeyframe');
        this.containers = {
            opacity: document.getElementById('opacityContainer'),
            rotation: document.getElementById('rotationContainer'),
            skewX: document.getElementById('skewXContainer'),
            skewY: document.getElementById('skewYContainer'),
            bgOffsetX: document.getElementById('imgOffsetXContainer'),
            bgOffsetY: document.getElementById('imgOffsetYContainer'),
            bgScale: document.getElementById('imgScaleContainer'),
            borderWidth: document.getElementById('borderWidthContainer'),
            borderColor: document.getElementById('borderColorContainer'),
            borderOffset: document.getElementById('borderOffsetContainer'),
            borderBlur: document.getElementById('borderBlurContainer'),
            shadowColor: document.getElementById('shadowColorContainer'),
            shadowBlur: document.getElementById('shadowBlurContainer'),
            shadowOffsetX: document.getElementById('shadowOffsetXContainer'),
            shadowOffsetY: document.getElementById('shadowOffsetYContainer'),
            shadowOpacity: document.getElementById('shadowOpacityContainer'),
            fontSize: document.getElementById('fontSizeContainer'),
            imgBrightness: document.getElementById('imgBrightnessContainer'),
            imgContrast: document.getElementById('imgContrastContainer'),
            imgSaturation: document.getElementById('imgSaturationContainer'),
            imgBlur: document.getElementById('imgBlurContainer'),
            pivotX: document.getElementById('pivotXContainer'),
            pivotY: document.getElementById('pivotYContainer'),
            polygonSides: document.getElementById('polygonSidesContainer')
        };
        this.colorInput = document.getElementById('shapeColor');
        this.borderColorInput = document.getElementById('shapeBorderColor');
        this.shadowColorInput = document.getElementById('shadowColor');
        this.textInput = document.getElementById('textInput');
        this.fontFamilySelect = document.getElementById('fontFamilySelect');
        this.btnBringFront = document.getElementById('btnBringFront');
        this.btnSendBack = document.getElementById('btnSendBack');
        this.btnCopy = document.getElementById('btnCopy');
        this.btnRemove = document.getElementById('btnRemove');
        this.btnUpdateText = document.getElementById('btnUpdateText');
        this.btnCloseShape = document.getElementById('btnCloseShape');
        this.btnOpenShape = document.getElementById('btnOpenShape');
        this.btnFinishShape = document.getElementById('btnFinishShape');
        this.btnSmoothCorners = document.getElementById('btnSmoothCorners');
        this.smoothCornersGroup = document.getElementById('smoothCornersGroup');
        this.smoothnessSliderContainer = document.getElementById('smoothnessSliderContainer');
        this.isEditingKeyframe = false;
        this.editingKeyframeIndex = -1;
        this.editingKeyframeTime = 0;
        this.undoManager = window.undoManager;
        this.sliders = {};
        this.initListeners();
    }
    initListeners() {
        if(this.openBtn) this.openBtn.addEventListener('click', () => this.openModal());
        if(this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        if(this.modal) this.modal.addEventListener('click', (e) => {
            if(e.target === this.modal) this.closeModal();
        });
        if(this.objListOpenBtn) this.objListOpenBtn.addEventListener('click', () => this.openObjectsList());
        if(this.objListCloseBtn) this.objListCloseBtn.addEventListener('click', () => this.closeObjectsList());
        if(this.objListModal) this.objListModal.addEventListener('click', (e) => {
            if(e.target === this.objListModal) this.closeObjectsList();
        });
        if(this.kfOpenBtn) this.kfOpenBtn.addEventListener('click', () => this.openKeyframes());
        if(this.kfCloseBtn) this.kfCloseBtn.addEventListener('click', () => this.closeKeyframes());
        if(this.kfModal) this.kfModal.addEventListener('click', (e) => {
            if(e.target === this.kfModal) this.closeKeyframes();
        });
        if(this.addKfBtn) this.addKfBtn.addEventListener('click', () => this.addSequentialKeyframe());
        if(this.fontFamilySelect) this.fontFamilySelect.addEventListener('change', (e) => this.updateProperty('fontFamily', e.target.value));
        if(this.btnBringFront) this.btnBringFront.addEventListener('click', () => this.bringToFront());
        if(this.btnSendBack) this.btnSendBack.addEventListener('click', () => this.sendToBack());
        if(this.btnCopy) this.btnCopy.addEventListener('click', () => this.copyShape());
        if(this.btnRemove) this.btnRemove.addEventListener('click', () => this.removeShape());
        if(this.btnCloseShape) this.btnCloseShape.addEventListener('click', () => this.closeShape());
        if(this.btnOpenShape) this.btnOpenShape.addEventListener('click', () => this.openShape());
        const btnFinishShape = document.getElementById('btnFinishShape');
        if(btnFinishShape) {
            btnFinishShape.addEventListener('click', () => this.finishShape());
        }
        const btnReEditShape = document.getElementById('btnReEditShape');
        if(btnReEditShape) {
            btnReEditShape.addEventListener('click', () => this.reEditShape());
        }
        const btnSmoothCorners = document.getElementById('btnSmoothCorners');
        if(btnSmoothCorners) {
            btnSmoothCorners.addEventListener('click', () => {
                this.smoothCorners(this.smoothnessValue || 0.3, false);
                this.applySmoothPreview();
            });
        }
        const btnCancelSmooth = document.getElementById('btnCancelSmooth');
        if(btnCancelSmooth) {
            btnCancelSmooth.addEventListener('click', () => {
                this.cancelSmoothPreview();
            });
        }
        if(this.btnUpdateText) {
            this.btnUpdateText.addEventListener('click', () => {
                if(this.selectedShape && this.selectedShape.type === 'text') {
                    const oldText = this.selectedShape.text;
                    const newText = this.textInput.value;
                    this.undoManager.execute(
                        new PropertyCommand(
                            this.selectedShape,
                            'text',
                            oldText,
                            newText,
                            () => this.redraw()
                        )
                    );
                }
            });
        }
        const shapeImageBtn = document.getElementById('shapeImageBtn');
        const shapeImageInput = document.getElementById('shapeImageInput');
        shapeImageBtn.addEventListener('click', () => shapeImageInput.click());
        shapeImageInput.addEventListener("change", (e) => {
            if(!this.selectedShape) return;
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    this.selectedShape.bgImage = ev.target.result;
                    this.selectedShape.bgImageObj = img;
                    this.redraw();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
            shapeImageInput.value = "";
        });
        const btnUpdateKeyframe = document.getElementById('btnUpdateKeyframe');
        if(btnUpdateKeyframe) {
            btnUpdateKeyframe.addEventListener('click', () => {
                this.saveCurrentKeyframe();
            });
        }
        const btnOpenEditModal = document.getElementById('btnOpenEditModal');
        if(btnOpenEditModal) {
            btnOpenEditModal.addEventListener('click', () => {
                this.openEditModal();
            });
        }
        const btnCancelEdit = document.getElementById('btnCancelEdit');
        if(btnCancelEdit) {
            btnCancelEdit.addEventListener('click', () => {
                this.exitEditMode();
                if(typeof interpolateAndDraw === 'function') {
                    interpolateAndDraw();
                }
            });
        }
        const btnResetPivot = document.getElementById('btnResetPivot');
        if(btnResetPivot) {
            btnResetPivot.addEventListener('click', () => {
                if(this.selectedShape) {
                    const oldState = {
                        pivotX: this.selectedShape.pivotX,
                        pivotY: this.selectedShape.pivotY
                    };
                    const newState = {
                        pivotX: 0,
                        pivotY: 0
                    };
                    this.undoManager.execute({
                        execute: () => {
                            this.selectedShape.pivotX = 0;
                            this.selectedShape.pivotY = 0;
                            this.redraw();
                        },
                        undo: () => {
                            this.selectedShape.pivotX = oldState.pivotX;
                            this.selectedShape.pivotY = oldState.pivotY;
                            this.redraw();
                        }
                    });
                    this.syncUI();
                }
            });
        }
    }
    _createPropertyUndo(prop, inputEl, getValue) {
        if(!this.selectedShape || !this.undoManager) return;
        let oldValue = this.selectedShape[prop];
        const handler = (e) => {
            if(!this.selectedShape || !this.undoManager) return;
            const newValue = getValue ? getValue(e) : e.target.value;
            if(oldValue !== newValue) {
                this.undoManager.execute(new PropertyCommand(
                    this.selectedShape, prop, oldValue, newValue, (val) => {
                        this.redraw();
                    }
                ));
                oldValue = newValue;
            }
        };
        inputEl.addEventListener('input', handler);
    }
    _setupPropertyListeners() {
        if(!this.selectedShape) return;
        if(this.colorInput) this._createPropertyUndo('color', this.colorInput);
        if(this.borderColorInput) this._createPropertyUndo('borderColor', this.borderColorInput);
        if(this.shadowColorInput) this._createPropertyUndo('shadowColor', this.shadowColorInput);
        if(this.containers.pivotX) {
            const input = this.containers.pivotX.querySelector('input');
            if(input) this._createPropertyUndo('pivotX', input, (e) => parseFloat(e.target.value));
        }
        if(this.containers.pivotY) {
            const input = this.containers.pivotY.querySelector('input');
            if(input) this._createPropertyUndo('pivotY', input, (e) => parseFloat(e.target.value));
        }
        const currentDeg = this.selectedShape.rotation * 180 / Math.PI;
        const rotationSlider = createRNSlider({
            label: `Rotation (${Math.round(currentDeg)}¡Æ)`,
            value: currentDeg,
            min: -1080,
            max: 1080,
            step: 1,
            orientation: 'horizontal',
            width: 280,
            height: 50,
            onChange: (degValue) => {
                if(this.undoManager && !this.undoManager.isBatching) {
                    const oldRad = this.selectedShape.rotation;
                    const newRad = degValue * Math.PI / 180;
                    this.undoManager.execute(new PropertyCommand(
                        this.selectedShape, 'rotation', oldRad, newRad, () => this.redraw()
                    ));
                }
                this.updateProperty('rotationDeg', degValue);
            }
        });
        this.containers['rotation'].appendChild(rotationSlider);
    }
    setSelectedShape(shape) {
        this.selectedShape = shape;
        if(this.selectedShape) {
            this.syncUI();
            this._setupPropertyUndoListeners();
            if(this.openBtn) this.openBtn.style.display = 'inline-flex';
            if(this.kfOpenBtn) this.kfOpenBtn.style.display = 'inline-flex';
            if(this.selectedShape.keyframes.length) this.buildTrack(shape);
        } else {
            if(this.openBtn) this.openBtn.style.display = 'none';
            if(this.kfOpenBtn) this.kfOpenBtn.style.display = 'none';
            this.closeKeyframes();
        }
        this.renderObjectsList();
    }
    _setupPropertyUndoListeners() {
        if(!this.selectedShape || !this.undoManager) return;
        if(this.undoListenersAttached) return;
        this.undoListenersAttached = true;
        if(this.colorInput) {
            let oldValue = this.selectedShape.color;
            this.colorInput.addEventListener('change', (e) => {
                const newValue = e.target.value;
                if(oldValue !== newValue && !this.undoManager.isBatching) {
                    this.undoManager.execute(new PropertyCommand(
                        this.selectedShape, 'color', oldValue, newValue, this.redraw
                    ));
                    oldValue = newValue;
                }
            });
        }
        if(this.borderColorInput) {
            let oldValue = this.selectedShape.borderColor;
            this.borderColorInput.addEventListener('change', (e) => {
                const newValue = e.target.value;
                if(oldValue !== newValue && !this.undoManager.isBatching) {
                    this.undoManager.execute(new PropertyCommand(
                        this.selectedShape, 'borderColor', oldValue, newValue, this.redraw
                    ));
                    oldValue = newValue;
                }
            });
        }
        if(this.shadowColorInput) {
            let oldValue = this.selectedShape.shadowColor;
            this.shadowColorInput.addEventListener('change', (e) => {
                const newValue = e.target.value;
                if(oldValue !== newValue && !this.undoManager.isBatching) {
                    this.undoManager.execute(new PropertyCommand(
                        this.selectedShape, 'shadowColor', oldValue, newValue, this.redraw
                    ));
                    oldValue = newValue;
                }
            });
        }
        if(this.containers.pivotX) {
            const input = this.containers.pivotX.querySelector('input');
            if(input) {
                let oldValue = this.selectedShape.pivotX;
                input.addEventListener('change', (e) => {
                    const newValue = parseFloat(e.target.value);
                    if(oldValue !== newValue && !this.undoManager.isBatching) {
                        this.undoManager.execute(new PropertyCommand(
                            this.selectedShape, 'pivotX', oldValue, newValue, this.redraw
                        ));
                        oldValue = newValue;
                    }
                });
            }
        }
        if(this.containers.pivotY) {
            const input = this.containers.pivotY.querySelector('input');
            if(input) {
                let oldValue = this.selectedShape.pivotY;
                input.addEventListener('change', (e) => {
                    const newValue = parseFloat(e.target.value);
                    if(oldValue !== newValue && !this.undoManager.isBatching) {
                        this.undoManager.execute(new PropertyCommand(
                            this.selectedShape, 'pivotY', oldValue, newValue, this.redraw
                        ));
                        oldValue = newValue;
                    }
                });
            }
        }
    }
    addSequentialKeyframe() {
        if (!this.selectedShape || !this.undoManager) return;
        
        const settings = this.getSettings();
        const step = settings ? parseFloat(settings.keyframeStep) || 1.0 : 1.0;
        
        let newTime = this.selectedShape.keyframes.length === 0 ? 0 : 
            parseFloat((this.selectedShape.keyframes[this.selectedShape.keyframes.length - 1].time + step).toFixed(2));
        
        // For groups, capture transform state
        const state = this.captureState();
        const kfData = { time: newTime, state };
        
        this.undoManager.execute(new KeyframeCommand(
            this.selectedShape, 'add', -1, kfData, 
            () => { 
                this.renderKeyframeList(); 
                this.redraw();
                // Rebuild track for this shape
                this.buildTrack(this.selectedShape);
            },
            () => this.recalculateGlobalDuration(),
            rebuildTracks(),
            drawTimelineRuler()
        ));
    }
    recalculateGlobalDuration() {
        let maxTime = 0;
        this.shapes.forEach(shape => {
            shape.keyframes.forEach(kf => {
                if(kf.time > maxTime) {
                    maxTime = kf.time;
                }
            });
        });
        window.animationState.duration = maxTime + (1 / window.animationState.fps);
        if(this.updateDuration) this.updateDuration(window.animationState.duration);
        this.shapes.forEach(shape => this.buildTrack(shape));
        updateTimelineSize();
    }
    captureState() {
        if(!this.selectedShape) return null;
        const shape = this.selectedShape;
        if (shape.type === 'group') {
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
                opacity: shape.opacity,
                color: shape.color,
                borderColor: shape.borderColor,
                borderWidth: shape.borderWidth,
                shadowColor: shape.shadowColor,
                shadowBlur: shape.shadowBlur,
                shadowOffsetX: shape.shadowOffsetX,
                shadowOffsetY: shape.shadowOffsetY,
                shadowOpacity: shape.shadowOpacity
            };
        }
    
        const pivotLocalX = this.selectedShape.pivotX * this.selectedShape.scaleX;
        const pivotLocalY = this.selectedShape.pivotY * this.selectedShape.scaleY;
        const cos = Math.cos(this.selectedShape.rotation);
        const sin = Math.sin(this.selectedShape.rotation);
        const pivotWorldX = this.selectedShape.x + pivotLocalX * cos - pivotLocalY * sin;
        const pivotWorldY = this.selectedShape.y + pivotLocalX * sin + pivotLocalY * cos;
        return JSON.parse(JSON.stringify({
            x: this.selectedShape.x,
            y: this.selectedShape.y,
            rotation: this.selectedShape.rotation,
            scaleX: this.selectedShape.scaleX,
            scaleY: this.selectedShape.scaleY,
            skewX: this.selectedShape.skewX,
            skewY: this.selectedShape.skewY,
            color: this.selectedShape.color,
            opacity: this.selectedShape.opacity,
            borderWidth: this.selectedShape.borderWidth,
            borderColor: this.selectedShape.borderColor,
            borderOffset: this.selectedShape.borderOffset,
            borderBlur: this.selectedShape.borderBlur,
            cornerRadius: this.selectedShape.cornerRadius,
            shadowColor: this.selectedShape.shadowColor,
            shadowBlur: this.selectedShape.shadowBlur,
            shadowOffsetX: this.selectedShape.shadowOffsetX,
            shadowOffsetY: this.selectedShape.shadowOffsetY,
            shadowOpacity: this.selectedShape.shadowOpacity,
            text: this.selectedShape.text,
            fontSize: this.selectedShape.fontSize,
            fontFamily: this.selectedShape.fontFamily,
            filterBrightness: this.selectedShape.filterBrightness,
            filterContrast: this.selectedShape.filterContrast,
            filterSaturation: this.selectedShape.filterSaturation,
            filterBlur: this.selectedShape.filterBlur,
            pivotX: this.selectedShape.pivotX,
            pivotY: this.selectedShape.pivotY,
            pivotWorldX: pivotWorldX,
            pivotWorldY: pivotWorldY,
            bgImage: this.selectedShape.bgImage,
            bgFit: this.selectedShape.bgFit,
            bgOffsetX: this.selectedShape.bgOffsetX,
            bgOffsetY: this.selectedShape.bgOffsetY,
            bgScale: this.selectedShape.bgScale,
            points: this.selectedShape.points ? this.selectedShape.points.map(p => ({
                ...p
            })) : null,
            type: this.selectedShape.type,
            sides: this.selectedShape.sides
        }));
    }
    applyState(shape, state) {
        if(!shape || !state) return;
        if (shape.type === 'group') {
            if (state.x !== undefined) shape.x = state.x;
            if (state.y !== undefined) shape.y = state.y;
            if (state.rotation !== undefined) shape.rotation = state.rotation;
            if (state.scaleX !== undefined) shape.scaleX = state.scaleX;
            if (state.scaleY !== undefined) shape.scaleY = state.scaleY;
            if (state.skewX !== undefined) shape.skewX = state.skewX;
            if (state.skewY !== undefined) shape.skewY = state.skewY;
            if (state.pivotX !== undefined) shape.pivotX = state.pivotX;
            if (state.pivotY !== undefined) shape.pivotY = state.pivotY;
            if (state.opacity !== undefined) shape.opacity = state.opacity;
            if (state.color !== undefined) shape.color = state.color;
            if (state.borderColor !== undefined) shape.borderColor = state.borderColor;
            if (state.borderWidth !== undefined) shape.borderWidth = state.borderWidth;
            if (state.shadowColor !== undefined) shape.shadowColor = state.shadowColor;
            if (state.shadowBlur !== undefined) shape.shadowBlur = state.shadowBlur;
            if (state.shadowOffsetX !== undefined) shape.shadowOffsetX = state.shadowOffsetX;
            if (state.shadowOffsetY !== undefined) shape.shadowOffsetY = state.shadowOffsetY;
            if (state.shadowOpacity !== undefined) shape.shadowOpacity = state.shadowOpacity;
            return;
        }
        if(state.pivotWorldX !== undefined && state.pivotWorldY !== undefined) {
            const pivotLocalX = state.pivotX * state.scaleX;
            const pivotLocalY = state.pivotY * state.scaleY;
            const cos = Math.cos(state.rotation);
            const sin = Math.sin(state.rotation);
            const offsetX = -pivotLocalX * cos + pivotLocalY * sin;
            const offsetY = -pivotLocalX * sin - pivotLocalY * cos;
            state.x = state.pivotWorldX + offsetX;
            state.y = state.pivotWorldY + offsetY;
        }
        if(state.fillImage) {
            const img = new Image();
            img.src = state.fillImage;
            shape.fillImageObj = img;
        }
        Object.assign(shape, state);
        if(state.points) {
            shape.points = state.points.map(p => ({
                ...p
            }));
        }
    }
    deleteKeyframe(index) {
        if(!this.selectedShape || !this.undoManager) return;
        const kfData = this.selectedShape.keyframes[index];
        this.undoManager.execute(new KeyframeCommand(
            this.selectedShape, 'delete', index, kfData,
            () => {
                this.renderKeyframeList();
                this.redraw();
            },
            () => this.recalculateGlobalDuration()
        ));
    }
    goToKeyframe(time) {
        if(window.seekAnimation) window.seekAnimation(time);
        this.redraw();
    }
    openObjectsList() {
        this.renderObjectsList();
        openPopup(this.objListModal);
    }
    closeObjectsList() {
        this.objListModal.classList.remove('open');
    }
    renderObjectsList() {
        if(!this.objListContainer) return;
        this.objListContainer.innerHTML = '';
        if(this.shapes.length === 0) {
            this.objListContainer.innerHTML = '<div style="padding:10px; color:#666; text-align:center;">No objects.</div>';
            return;
        }
        this.shapes.forEach((shape, index) => {
            const div = document.createElement('div');
            const isSelected = shape === this.selectedShape;
            div.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin-bottom:6px; border-radius:6px; border:1px solid ${isSelected ? '#00d4ff' : '#333'}; background: ${isSelected ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255,255,255,0.05)'}; cursor: pointer;`;
            const info = document.createElement('div');
            info.style.display = 'flex';
            info.style.alignItems = 'center';
            info.style.gap = '10px';
            const icon = document.createElement('i');
            icon.className = shape.type === 'text' ? 'fa-solid fa-font' : (shape.type === 'image' ? 'fa-regular fa-image' : 'fa-solid fa-shapes');
            icon.style.color = isSelected ? '#00d4ff' : '#a0a0a0';
            const name = document.createElement('span');
            name.textContent = `${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} ${index + 1}`;
            name.style.color = isSelected ? '#00d4ff' : '#e0e0e0';
            name.style.fontWeight = isSelected ? 'bold' : 'normal';
            info.appendChild(icon);
            info.appendChild(name);
            const kfCount = document.createElement('span');
            kfCount.textContent = `${shape.keyframes.length} KF`;
            kfCount.style.fontSize = '0.8rem';
            kfCount.style.color = '#666';
            div.appendChild(info);
            div.appendChild(kfCount);
            div.onclick = () => {
                this.setSelectedShape(shape);
                this.redraw();
            };
            this.objListContainer.appendChild(div);
        });
    }
    openKeyframes() {
        if(!this.selectedShape) return;
        this.renderKeyframeList();
        openPopup(this.kfModal);
    }
    closeKeyframes() {
        this.kfModal.classList.remove('open');
        this.exitEditMode();
    }
    exitEditMode() {
        const editBar = document.getElementById('kfEditBar');
        if(editBar) editBar.style.display = 'none';
        const updateBtn = document.getElementById('btnUpdateKeyframe');
        if(updateBtn) updateBtn.style.display = 'none';
        this.editingKeyframeIndex = -1;
        this.editingKeyframeTime = 0;
        this.isEditingKeyframe = false;
    }
    renderKeyframeList() {
        if(!this.kfListContainer || !this.selectedShape) return;
        this.kfListContainer.innerHTML = '';
        this.exitEditMode();
        if(this.selectedShape.keyframes.length === 0) {
            this.kfListContainer.innerHTML = '<div style="padding:10px; color:#666; text-align:center;">No keyframes.</div>';
            return;
        }
        this.selectedShape.keyframes.forEach((kf, index) => {
            const div = document.createElement('div');
            div.classList.add("keyframe-item");
            div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; margin-bottom:6px; border-radius:6px; border:1px solid #333;';
            div.onclick = () => {
                const items = this.kfListContainer.querySelectorAll(".keyframe-item");
                items.forEach(el => {
                    el.classList.remove("active");
                    el.style.background = "rgba(255,255,255,0.05)";
                    el.style.border = "1px solid #333";
                });
                div.classList.add("active");
                div.style.background = "rgba(0,212,255,0.15)";
                div.style.border = "1px solid #00d4ff";
                this.enterEditMode(index);
            };
            const timeSpan = document.createElement('span');
            timeSpan.textContent = `${kf.time.toFixed(2)}s`;
            timeSpan.style.color = '#00d4ff';
            timeSpan.style.cursor = 'pointer';
            timeSpan.style.fontWeight = 'bold';
            timeSpan.onclick = () => this.goToKeyframe(kf.time);
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = "Update this Keyframe";
            editBtn.style.background = 'transparent';
            editBtn.style.border = 'none';
            editBtn.style.color = '#00d4ff';
            editBtn.style.cursor = 'pointer';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                this.enterEditMode(index);
                this.openEditModal();
            };
            const saveBtn = document.createElement('button');
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
            saveBtn.title = "Update this Keyframe";
            saveBtn.style.background = 'transparent';
            saveBtn.style.border = 'none';
            saveBtn.style.color = '#00d4ff';
            saveBtn.style.cursor = 'pointer';
            saveBtn.onclick = (e) => {
                e.stopPropagation();
                this.saveCurrentKeyframe();
            };
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.style.background = 'transparent';
            delBtn.style.border = 'none';
            delBtn.style.color = '#ff6b6b';
            delBtn.style.cursor = 'pointer';
            delBtn.onclick = () => this.deleteKeyframe(index);
            actions.appendChild(editBtn);
            actions.appendChild(saveBtn);
            actions.appendChild(delBtn);
            div.appendChild(timeSpan);
            div.appendChild(actions);
            this.kfListContainer.appendChild(div);
        });
    }
    enterEditMode(index) {
        if(!this.selectedShape || index < 0 || index >= this.selectedShape.keyframes.length) return;
        this.editingKeyframeIndex = index;
        this.editingKeyframeTime = this.selectedShape.keyframes[index].time;
        this.isEditingKeyframe = true;
        const editBar = document.getElementById('kfEditBar');
        const timeLabel = document.getElementById('kfEditTime');
        if(editBar && timeLabel) {
            timeLabel.textContent = this.editingKeyframeTime.toFixed(2) + 's';
            editBar.style.display = 'block';
        }
        const updateBtn = document.getElementById('btnUpdateKeyframe');
        if(updateBtn) {
            updateBtn.style.display = 'inline-flex';
            updateBtn.title = `Update Keyframe at ${this.editingKeyframeTime.toFixed(2)}s`;
        }
        if(window.seekAnimation) {
            window.seekAnimation(this.editingKeyframeTime);
        }
        let kfState = this.selectedShape.keyframes[index].state;
        if(kfState.pivotWorldX === undefined) {
            const pivotLocalX = kfState.pivotX * kfState.scaleX;
            const pivotLocalY = kfState.pivotY * kfState.scaleY;
            const cos = Math.cos(kfState.rotation);
            const sin = Math.sin(kfState.rotation);
            kfState.pivotWorldX = kfState.x + pivotLocalX * cos - pivotLocalY * sin;
            kfState.pivotWorldY = kfState.y + pivotLocalX * sin + pivotLocalY * cos;
        }
        this.applyState(this.selectedShape, kfState);
        this.redraw();
    }
    openEditModal() {
        if(this.editingKeyframeIndex === -1 || !this.selectedShape) return;
        this.openModal();
    }
    saveCurrentKeyframe() {
        if(!this.isEditingKeyframe || this.editingKeyframeIndex === -1 || !this.selectedShape) {
            showToast("No keyframe selected for editing.", 'E');
            return;
        }
        const index = this.editingKeyframeIndex;
        const time = this.selectedShape.keyframes[index].time;
        const oldState = JSON.parse(
            JSON.stringify(
                this.selectedShape.keyframes[index].state
            )
        );
        const newState = this.captureState();
        this.undoManager.execute(
            new KeyframeCommand(
                this.selectedShape,
                'update',
                index, {
                    oldState: oldState,
                    newState: newState
                },
                () => {
                    this.renderKeyframeList();
                    this.redraw();
                },
                () => this.recalculateGlobalDuration()
            )
        );
        showToast(`Keyframe at ${time.toFixed(2)}s updated successfully!`, 'S');
        this.exitEditMode();
        this.redraw();
    }
    closeModal() {
        if(this.editingKeyframeIndex !== -1) {
            if(confirm("Save changes to this keyframe?")) {
                this.saveCurrentKeyframe();
            }
            this.exitEditMode();
        }
        this.modal.classList.remove('open');
    }
    clearContainers() {
        Object.values(this.containers).forEach(el => {
            if(el) {
                el.innerHTML = '';
                el.style.display = 'none';
            }
        });
        if(this.textInput) this.textInput.parentElement.parentElement.style.display = 'none';
        if(this.btnUpdateText) this.btnUpdateText.style.display = 'none';
    }
    showSection(sectionName) {
        const map = {
            'common': ['opacity', 'rotation', 'skewX', 'skewY', 'bgOffsetX', 'bgOffsetY', 'bgScale', 'pivotX', 'pivotY', 'polygonSides'],
            'border': ['borderWidth', 'borderColor', 'borderOffset', 'borderBlur'],
            'shadow': ['shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'shadowOpacity'],
            'text': ['fontSize'],
            'image': ['imgBrightness', 'imgContrast', 'imgSaturation', 'imgBlur'],
            'pivot': ['pivotX', 'pivotY']
        };
        if(map[sectionName]) map[sectionName].forEach(id => {
            if(this.containers[id]) this.containers[id].style.display = 'block';
        });
    }
    initSliders() {
        if(!this.selectedShape) return;
        const createSlider = (idKey, label, val, min, max, step, prop) => {
            if(!this.containers[idKey]) return;
            const wrapper = createRNSlider({
                label,
                value: val !== undefined ? val : ((min + max) / 2),
                min,
                max,
                step,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => this.updateProperty(prop, v)
            });
            this.containers[idKey].appendChild(wrapper);
        };
        const createSliderWithUndo = (idKey, label, val, min, max, step, prop) => {
            if(!this.containers[idKey]) return;
            let startValue = val;
            const wrapper = createRNSlider({
                label,
                value: val,
                min,
                max,
                step,
                orientation: 'horizontal',
                width: 280,
                height: 50,
                onChange: (v) => {
                    if(this.selectedShape && this.selectedShape.type === "group") {
                        if(prop === 'opacity') this.selectedShape.setOpacity(v);
                        else if(prop === 'borderWidth') this.selectedShape.setBorderWidth(v);
                        else if(prop === 'borderOffset') this.selectedShape.setBorderOffset(v);
                        else if(prop === 'borderBlur') this.selectedShape.setBorderBlur(v);
                        else if(prop === 'shadowBlur') this.selectedShape.setShadowBlur(v);
                        else if(prop === 'shadowOffsetX') this.selectedShape.setShadowOffsetX(v);
                        else if(prop === 'shadowOffsetY') this.selectedShape.setShadowOffsetY(v);
                        else if(prop === 'shadowOpacity') this.selectedShape.setShadowOpacity(v);
                        else this.selectedShape[prop] = v;
                    } else {
                        this.selectedShape[prop] = v;
                    }
                    this.redraw();
                }
            });
            wrapper.addEventListener('mousedown', () => {
                startValue = this.selectedShape[prop];
            });
            wrapper.addEventListener('mouseup', () => {
                const endValue = this.selectedShape[prop];
                if(startValue !== endValue && this.undoManager) {
                    this.undoManager.execute(
                        new PropertyCommand(
                            this.selectedShape,
                            prop,
                            startValue,
                            endValue,
                            () => this.redraw()
                        )
                    );
                }
            });
            this.containers[idKey].appendChild(wrapper);
        };
        const currentDeg = this.selectedShape.rotation * 180 / Math.PI;
        const rotationSlider = createRNSlider({
            label: `Rotation (${Math.round(currentDeg)}¡Æ)`,
            value: currentDeg,
            min: -1080,
            max: 1080,
            step: 1,
            orientation: 'horizontal',
            width: 280,
            height: 50,
            onChange: (degValue) => {
                if(this.undoManager && !this.undoManager.isBatching) {
                    const oldRad = this.selectedShape.rotation;
                    const newRad = degValue * Math.PI / 180;
                    this.undoManager.execute(new PropertyCommand(
                        this.selectedShape, 'rotation', oldRad, newRad, () => this.redraw()
                    ));
                }
                this.updateProperty('rotationDeg', degValue);
            }
        });
        this.containers['rotation'].appendChild(rotationSlider);
        createSliderWithUndo('opacity', 'Opacity', this.selectedShape.opacity, 0, 1, 0.01, 'opacity');
        createSliderWithUndo('skewX', 'Skew X', this.selectedShape.skewX * 180 / Math.PI, -60, 60, 1, 'skewX');
        createSliderWithUndo('skewY', 'Skew Y', this.selectedShape.skewY * 180 / Math.PI, -60, 60, 1, 'skewY');
        createSliderWithUndo('bgOffsetX', 'BG Image X', this.selectedShape.bgOffsetX, -500, 500, 1, 'bgOffsetX');
        createSliderWithUndo('bgOffsetY', 'BG Image Y', this.selectedShape.bgOffsetY, -500, 500, 1, 'bgOffsetY');
        createSliderWithUndo('bgScale', 'BG Image Scale', this.selectedShape.bgScale, 0.1, 5, 0.01, 'bgScale');
        createSliderWithUndo('borderWidth', 'Border Width', this.selectedShape.borderWidth, 0, 20, 1, 'borderWidth');
        createSliderWithUndo('borderOffset', 'Border Offset', this.selectedShape.borderOffset, -20, 20, 1, 'borderOffset');
        createSliderWithUndo('borderBlur', 'Border Blur', this.selectedShape.borderBlur, 0, 50, 1, 'borderBlur');
        createSliderWithUndo('shadowBlur', 'Shadow Blur', this.selectedShape.shadowBlur, 0, 100, 1, 'shadowBlur');
        createSliderWithUndo('shadowOffsetX', 'Shadow X', this.selectedShape.shadowOffsetX, -100, 100, 1, 'shadowOffsetX');
        createSliderWithUndo('shadowOffsetY', 'Shadow Y', this.selectedShape.shadowOffsetY, -100, 100, 1, 'shadowOffsetY');
        createSliderWithUndo('shadowOpacity', 'Shadow Opacity', this.selectedShape.shadowOpacity, 0, 1, 0.01, 'shadowOpacity');
        createSliderWithUndo('fontSize', 'Font Size', this.selectedShape.fontSize, 10, 200, 1, 'fontSize');
        createSliderWithUndo('imgBrightness', 'Brightness', this.selectedShape.filterBrightness, 0, 200, 1, 'filterBrightness');
        createSliderWithUndo('imgContrast', 'Contrast', this.selectedShape.filterContrast, 0, 200, 1, 'filterContrast');
        createSliderWithUndo('imgSaturation', 'Saturation', this.selectedShape.filterSaturation, 0, 200, 1, 'filterSaturation');
        createSliderWithUndo('imgBlur', 'Image Blur', this.selectedShape.filterBlur, 0, 20, 1, 'filterBlur');
        createSliderWithUndo('pivotX', 'Pivot X (Local)', this.selectedShape.pivotX, -200, 200, 1, 'pivotX');
        createSliderWithUndo('pivotY', 'Pivot Y (Local)', this.selectedShape.pivotY, -200, 200, 1, 'pivotY');
        createSliderWithUndo('polygonSides', 'Sides', this.selectedShape.sides, 3, 12, 1, 'sides');
    }
    closeShape() {
        if(!this.selectedShape ||
            (this.selectedShape.type !== "polyline" && this.selectedShape.type !== "path")) {
            showToast("Select a polyline or path", 'E');
            return;
        }
        if(this.selectedShape.points.length < 3) {
            showToast("Need at least 3 points to close shape", 'E');
            return;
        }
        const first = this.selectedShape.points[0];
        const last = this.selectedShape.points[this.selectedShape.points.length - 1];
        const isAlreadyClosed = (
            Math.abs(first.x - last.x) < 0.1 &&
            Math.abs(first.y - last.y) < 0.1
        );
        if(isAlreadyClosed) {
            showToast("Shape is already closed", 'I');
            return;
        }
        if(this.selectedShape.type === "polyline") {
            const firstPointCopy = {
                x: first.x,
                y: first.y
            };
            if(this.undoManager) {
                const oldPoints = JSON.parse(JSON.stringify(this.selectedShape.points));
                this.undoManager.execute({
                    execute: () => {
                        this.selectedShape.points.push(firstPointCopy);
                        this.redraw();
                    },
                    undo: () => {
                        this.selectedShape.points = oldPoints;
                        this.redraw();
                    }
                });
            } else {
                this.selectedShape.points.push(firstPointCopy);
                this.redraw();
            }
            showToast("Polyline closed!", 'S');
        } else if(this.selectedShape.type === "path") {
            const firstPointCopy = {
                x: first.x,
                y: first.y,
                in: {
                    ...first.in
                },
                out: {
                    ...first.out
                },
                curve: first.curve
            };
            if(this.undoManager) {
                const oldPoints = JSON.parse(JSON.stringify(this.selectedShape.points));
                this.undoManager.execute({
                    execute: () => {
                        this.selectedShape.points.push(firstPointCopy);
                        this.redraw();
                    },
                    undo: () => {
                        this.selectedShape.points = oldPoints;
                        this.redraw();
                    }
                });
            } else {
                this.selectedShape.points.push(firstPointCopy);
                this.redraw();
            }
            showToast("Path closed!", 'S');
        }
        this.syncUI();
    }
    openShape() {
        if(!this.selectedShape ||
            (this.selectedShape.type !== "polyline" && this.selectedShape.type !== "path")) {
            return;
        }
        if(this.selectedShape.points.length > 1) {
            const first = this.selectedShape.points[0];
            const last = this.selectedShape.points[this.selectedShape.points.length - 1];
            if(Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1) {
                this.selectedShape.points.pop();
                if(this.undoManager) {
                    this.undoManager.execute({
                        execute: () => {
                            this.redraw();
                        },
                        undo: () => {
                            this.selectedShape.points.push({
                                ...first
                            });
                            this.redraw();
                        }
                    });
                }
                this.redraw();
            }
        }
        this.syncUI();
    }
    syncUI() {
        if(!this.selectedShape || !this.modal) return;
        this.clearContainers();
        let title = "Edit ";
        if(this.selectedShape.type === "group") {
            title = `Group: ${this.selectedShape.name}`;
            this.popupTitle.textContent = title;
            const groupInfo = document.getElementById('groupInfo');
            const groupChildCount = document.getElementById('groupChildCount');
            if(groupInfo && groupChildCount) {
                groupInfo.style.display = 'block';
                groupChildCount.innerHTML = `<i class="fa-solid fa-cubes"></i> Contains ${this.selectedShape.children.length} objects<br>
                                            <small style="color:#888;">Properties affect all children</small>`;
                const btnUngroupModal = document.getElementById('btnUngroupFromModal');
                if(btnUngroupModal) {
                    btnUngroupModal.onclick = () => {
                        if(window.ungroupSelected) window.ungroupSelected();
                        this.closeModal();
                    };
                }
            }
            this.showSection('common');
            this.showSection('border');
            this.showSection('shadow');
            this.initSliders();
            return;
        } else {
            const groupInfo = document.getElementById('groupInfo');
            if(groupInfo) groupInfo.style.display = 'none';
        }
        if(this.selectedShape.type === 'text') title += "Text";
        else if(this.selectedShape.type === 'image') title += "Image";
        else if(this.selectedShape.type === 'path') title += "Path";
        else if(this.selectedShape.type === 'polyline') title += "Polyline";
        else title += "Shape";
        this.popupTitle.textContent = title;
        if(this.colorInput) {
            this.colorInput.value = this.selectedShape.color || '#00d4ff';
            this.colorInput.parentElement.parentElement.style.display =
                (this.selectedShape.type === 'image') ? 'none' : 'flex';
        }
        if(this.borderColorInput) {
            this.borderColorInput.value = this.selectedShape.borderColor || '#ffffff';
        }
        if(this.shadowColorInput) {
            this.shadowColorInput.value = this.selectedShape.shadowColor || '#000000';
        }
        if(this.selectedShape.type === 'text') {
            if(this.textInput) {
                this.textInput.value = this.selectedShape.text;
                this.textInput.parentElement.parentElement.style.display = 'block';
            }
            if(this.btnUpdateText) this.btnUpdateText.style.display = 'flex';
            this.showSection('text');
        }
        if(this.selectedShape.type === "polygon") {
            this.containers.polygonSides.style.display = "block";
        }
        this.showSection('common');
        if(this.selectedShape.type !== 'line') {
            this.showSection('border');
            this.showSection('shadow');
        } else {
            this.showSection('shadow');
        }
        if(this.selectedShape.type === 'image') {
            document.getElementById('imageInputGroup').style.display = "block";
            this.showSection('image');
        } else {
            document.getElementById('imageInputGroup').style.display = "none";
        }
        const polylineOptionsGroup = document.getElementById('polylineOptionsGroup');
        const smoothCornersGroup = document.getElementById('smoothCornersGroup');
        const finishHint = document.getElementById('finishHint');
        if(polylineOptionsGroup && smoothCornersGroup) {
            if((this.selectedShape.type === "polyline" || this.selectedShape.type === "path") &&
                this.selectedShape.points && this.selectedShape.points.length >= 2) {
                polylineOptionsGroup.style.display = 'block';
                const btnFinishShape = document.getElementById('btnFinishShape');
                const btnReEditShape = document.getElementById('btnReEditShape');
                if(btnFinishShape && btnReEditShape) {
                    if(this.selectedShape.finished) {
                        btnFinishShape.style.display = 'none';
                        btnReEditShape.style.display = 'flex';
                        if(finishHint) {
                            finishHint.style.display = 'block';
                            finishHint.innerHTML = '<i class="fa-solid fa-info-circle"></i> Shape is finished — double-click to re-edit points';
                        }
                    } else {
                        btnFinishShape.style.display = 'flex';
                        btnReEditShape.style.display = 'none';
                        if(finishHint) finishHint.style.display = 'none';
                    }
                }
                if(!this.selectedShape.finished && this.selectedShape.points.length >= 3) {
                    smoothCornersGroup.style.display = 'block';
                    this.initSmoothnessSlider();
                } else {
                    smoothCornersGroup.style.display = 'none';
                }
                const btnCloseShape = document.getElementById('btnCloseShape');
                const btnOpenShape = document.getElementById('btnOpenShape');
                if(btnCloseShape && btnOpenShape) {
                    btnCloseShape.style.display = 'flex';
                    const pts = this.selectedShape.points;
                    const isClosed = (pts.length > 2 &&
                        pts[0] && pts[pts.length - 1] &&
                        Math.abs(pts[0].x - pts[pts.length - 1].x) < 0.1 &&
                        Math.abs(pts[0].y - pts[pts.length - 1].y) < 0.1);
                    btnOpenShape.style.display = isClosed ? 'flex' : 'none';
                }
            } else {
                polylineOptionsGroup.style.display = 'none';
                smoothCornersGroup.style.display = 'none';
            }
        }
        const fillColorInfo = document.getElementById('fillColorInfo');
        if(fillColorInfo) {
            if((this.selectedShape.type === "polyline" || this.selectedShape.type === "path") &&
                this.selectedShape.points && this.selectedShape.points.length > 2) {
                const first = this.selectedShape.points[0];
                const last = this.selectedShape.points[this.selectedShape.points.length - 1];
                const isClosed = (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1);
                fillColorInfo.style.display = 'block';
                fillColorInfo.innerHTML = isClosed ?
                    `<i class="fa-solid fa-fill-drip" style="color:var(--accent)"></i> Shape is closed — fill color is active` :
                    `<i class="fa-solid fa-circle-info" style="color:#888"></i> Connect first & last points to enable fill`;
            } else {
                fillColorInfo.style.display = 'none';
            }
        }
        if(this.btnFinishShape) {
            if((this.selectedShape.type === "polyline" || this.selectedShape.type === "path") &&
                !this.selectedShape.finished) {
                this.btnFinishShape.style.display = 'flex';
            } else {
                this.btnFinishShape.style.display = 'none';
            }
        }
        if(this.smoothCornersGroup && this.smoothnessSliderContainer) {
            if((this.selectedShape.type === "polyline" || this.selectedShape.type === "path") &&
                !this.selectedShape.finished &&
                this.selectedShape.points && this.selectedShape.points.length >= 3) {
                this.smoothCornersGroup.style.display = 'block';
                this.initSmoothnessSlider();
            } else {
                this.smoothCornersGroup.style.display = 'none';
                this.smoothnessSliderContainer.style.display = 'none';
            }
        }
        this.initSliders();
    }
    openModal() {
        if(!this.selectedShape) return;
        this.syncUI();
        openPopup(this.modal);
    }
    updateProperty(prop, value) {
        if(!this.selectedShape) return;
        if(prop === 'rotationDeg') {
            const newRotation = value * Math.PI / 180;
            if(this.selectedShape.pivotX !== 0 || this.selectedShape.pivotY !== 0) {
                const pivotLocalX = this.selectedShape.pivotX * this.selectedShape.scaleX;
                const pivotLocalY = this.selectedShape.pivotY * this.selectedShape.scaleY;
                const oldCos = Math.cos(this.selectedShape.rotation);
                const oldSin = Math.sin(this.selectedShape.rotation);
                const pivotWorldX = this.selectedShape.x + pivotLocalX * oldCos - pivotLocalY * oldSin;
                const pivotWorldY = this.selectedShape.y + pivotLocalX * oldSin + pivotLocalY * oldCos;
                this.selectedShape.rotation = newRotation;
                const newCos = Math.cos(newRotation);
                const newSin = Math.sin(newRotation);
                const offsetX = -pivotLocalX * newCos + pivotLocalY * newSin;
                const offsetY = -pivotLocalX * newSin - pivotLocalY * newCos;
                this.selectedShape.x = pivotWorldX + offsetX;
                this.selectedShape.y = pivotWorldY + offsetY;
            } else {
                this.selectedShape.rotation = newRotation;
            }
            const sliderWrapper = this.containers['rotation']?.querySelector('.rn-slider-wrapper');
        } else if(prop === 'pivotX' || prop === 'pivotY') {
            this.selectedShape[prop] = value;
        } else if(prop === 'skewX') {
            this.selectedShape.skewX = value * Math.PI / 180;
        } else if(prop === 'skewY') {
            this.selectedShape.skewY = value * Math.PI / 180;
        } else if(prop === 'bgOffsetX') {
            this.selectedShape.bgOffsetX = value;
        } else if(prop === 'bgOffsetY') {
            this.selectedShape.bgOffsetY = value;
        } else if(prop === 'bgScale') {
            this.selectedShape.bgScale = value;
        } else {
            this.selectedShape[prop] = value;
        }
        this.redraw();
    }
    bringToFront() {
        if(!this.selectedShape || !this.undoManager) return;
        const oldIndex = this.shapes.indexOf(this.selectedShape);
        const newIndex = this.shapes.length - 1;
        this.undoManager.execute({
            execute: () => {
                this.shapes.splice(oldIndex, 1);
                this.shapes.push(this.selectedShape);
                this.redraw();
            },
            undo: () => {
                const idx = this.shapes.indexOf(this.selectedShape);
                this.shapes.splice(idx, 1);
                this.shapes.splice(oldIndex, 0, this.selectedShape);
                this.redraw();
            }
        });
    }
    sendToBack() {
        if(!this.selectedShape || !this.undoManager) return;
        const oldIndex = this.shapes.indexOf(this.selectedShape);
        this.undoManager.execute({
            execute: () => {
                this.shapes.splice(oldIndex, 1);
                this.shapes.unshift(this.selectedShape);
                this.redraw();
            },
            undo: () => {
                const idx = this.shapes.indexOf(this.selectedShape);
                this.shapes.splice(idx, 1);
                this.shapes.splice(oldIndex, 0, this.selectedShape);
                this.redraw();
            }
        });
    }
    copyShape() {
        if(!this.selectedShape || !this.undoManager) return;
        let newShape;
        if(this.selectedShape.type === "group") {
            const original = this.selectedShape;
            newShape = new Group(original.name + " Copy");
            newShape.x = original.x + 20;
            newShape.y = original.y + 20;
            newShape.rotation = original.rotation;
            newShape.scaleX = original.scaleX;
            newShape.scaleY = original.scaleY;
            newShape.skewX = original.skewX;
            newShape.skewY = original.skewY;
            newShape.pivotX = original.pivotX;
            newShape.pivotY = original.pivotY;
            newShape.opacity = original.opacity;
            newShape.color = original.color;
            newShape.borderColor = original.borderColor;
            newShape.borderWidth = original.borderWidth;
            newShape.borderOffset = original.borderOffset;
            newShape.borderBlur = original.borderBlur;
            newShape.shadowColor = original.shadowColor;
            newShape.shadowBlur = original.shadowBlur;
            newShape.shadowOffsetX = original.shadowOffsetX;
            newShape.shadowOffsetY = original.shadowOffsetY;
            newShape.shadowOpacity = original.shadowOpacity;
            original.children.forEach(child => {
                let childCopy;
                if(child.type === "group") {
                    childCopy = new Group(child.name + " Copy");
                    childCopy.x = child.x;
                    childCopy.y = child.y;
                    childCopy.rotation = child.rotation;
                    childCopy.scaleX = child.scaleX;
                    childCopy.scaleY = child.scaleY;
                    childCopy.opacity = child.opacity;
                    childCopy.color = child.color;
                } else {
                    childCopy = new Shape(child.type, child.x, child.y, child.size);
                    childCopy.rotation = child.rotation;
                    childCopy.scaleX = child.scaleX;
                    childCopy.scaleY = child.scaleY;
                    childCopy.skewX = child.skewX;
                    childCopy.skewY = child.skewY;
                    childCopy.pivotX = child.pivotX;
                    childCopy.pivotY = child.pivotY;
                    childCopy.opacity = child.opacity;
                    childCopy.color = child.color;
                    childCopy.borderColor = child.borderColor;
                    childCopy.borderWidth = child.borderWidth;
                    childCopy.shadowColor = child.shadowColor;
                    childCopy.shadowBlur = child.shadowBlur;
                    childCopy.shadowOffsetX = child.shadowOffsetX;
                    childCopy.shadowOffsetY = child.shadowOffsetY;
                    childCopy.shadowOpacity = child.shadowOpacity;
                    childCopy.text = child.text;
                    childCopy.fontSize = child.fontSize;
                    childCopy.fontFamily = child.fontFamily;
                    if(child.imageObj) childCopy.imageObj = child.imageObj;
                    if(child.points) {
                        childCopy.points = JSON.parse(JSON.stringify(child.points));
                    }
                }
                childCopy.parentGroup = newShape;
                newShape.children.push(childCopy);
            });
            newShape.selected = true;
        } else {
            newShape = new Shape(this.selectedShape.type, this.selectedShape.x + 20, this.selectedShape.y + 20, this.selectedShape.size);
            Object.assign(newShape, JSON.parse(JSON.stringify({
                ...this.selectedShape,
                imageObj: this.selectedShape.imageObj,
                bgImageObj: this.selectedShape.bgImageObj
            })));
            newShape.keyframes = [];
            newShape.selected = true;
        }
        this.undoManager.execute(new ObjectLifecycleCommand(
            shapes, newShape, 'add', shapes.length, () => {
                shapes.forEach(s => s.selected = false);
                this.selectedShape = newShape;
                this.redraw();
            }
        ));
        this.closeModal();
    }
    removeShape() {
        if(!this.selectedShape || !this.undoManager) return;
        const index = this.shapes.indexOf(this.selectedShape);
        if(index > -1) {
            this.undoManager.execute(new ObjectLifecycleCommand(
                this.shapes, this.selectedShape, 'remove', index, () => {
                    this.selectedShape = null;
                    this.redraw();
                }
            ));
            this.closeModal();
            this.closeKeyframes();
            if(this.openBtn) this.openBtn.style.display = 'none';
            if(this.kfOpenBtn) this.kfOpenBtn.style.display = 'none';
            this.recalculateGlobalDuration();
            this.renderObjectsList();
        }
    }
    buildTrack(shape) {
        const fps = window.animationState.fps;
        const duration = window.animationState.duration;
        const totalFrames = Math.ceil(duration * fps);
    
        shape.track = new Array(totalFrames);
    
        for(let f = 0; f < totalFrames; f++){
            const time = f / fps;
            let prev = null;
            let next = null;
    
            for(let kf of shape.keyframes){
                if(kf.time <= time) prev = kf;
                if(kf.time > time){
                    next = kf;
                    break;
                }
            }
    
            if(!prev){
                shape.track[f] = null;
                continue;
            }
    
            if(!next){
                shape.track[f] = prev.state;
                continue;
            }
    
            const duration = next.time - prev.time;
            const progress = (time - prev.time) / duration;
            
            // Apply easing
            const easingType = window.animationState.settings.easing || 'linear';
            const eased = getEasingFunction(easingType, progress);
    
            shape.track[f] = lerpState(prev.state, next.state, eased);
        }
        
        // If this is a group, also build tracks for children
        if (shape.type === 'group' && shape.children) {
            for (let child of shape.children) {
                this.buildTrack(child);
            }
        }
    }
    scrollKeyframeIntoView(index) {
        if(!this.kfListContainer) return;
        const items = this.kfListContainer.children;
        if(index < 0 || index >= items.length) return;
        const el = items[index];
        if(!el) return;
        el.style.background = "rgba(0,212,255,0.15)";
        el.style.border = "1px solid #00d4ff";
        el.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
    finishShape() {
        if(!this.selectedShape ||
            (this.selectedShape.type !== "polyline" && this.selectedShape.type !== "path")) {
            showToast("Select a polyline or path", 'E');
            return;
        }
        if(this.selectedShape.points.length < 2) {
            showToast("Need at least 2 points to finish", 'E');
            return;
        }
        const oldFinished = this.selectedShape.finished;
        const oldEditable = this.selectedShape.editable;
        if(this.undoManager) {
            this.undoManager.execute({
                execute: () => {
                    this.selectedShape.finished = true;
                    this.selectedShape.editable = false;
                    penMode = false;
                    showToast("Shape finished! Double-click to re-edit", 'S');
                    this.redraw();
                    this.syncUI();
                },
                undo: () => {
                    this.selectedShape.finished = oldFinished;
                    this.selectedShape.editable = oldEditable;
                    this.redraw();
                    this.syncUI();
                }
            });
        } else {
            this.selectedShape.finished = true;
            this.selectedShape.editable = false;
            penMode = false;
            this.redraw();
            this.syncUI();
        }
    }
    reEditShape() {
        if(!this.selectedShape ||
            (this.selectedShape.type !== "polyline" && this.selectedShape.type !== "path")) {
            return;
        }
        this.selectedShape.finished = false;
        this.selectedShape.editable = true;
        penMode = true;
        showToast("Edit Mode: Click to add points, Drag to move points", 'I');
        this.redraw();
        this.syncUI();
    }
    smoothCorners(smoothness = 0.3, preview = false) {
        if(!this.selectedShape ||
            (this.selectedShape.type !== "polyline" && this.selectedShape.type !== "path")) {
            return;
        }
        if(this.selectedShape.points.length < 3) {
            showToast("Need at least 3 points to smooth", 'E');
            return;
        }
        if(!this._originalPoints) {
            this._originalPoints = JSON.parse(JSON.stringify(this.selectedShape.points));
        }
        if(this.selectedShape.type === "polyline") {
            this.selectedShape.type = "path";
            this.selectedShape.points.forEach(p => {
                if(!p.in) p.in = {
                    x: 0,
                    y: 0
                };
                if(!p.out) p.out = {
                    x: 0,
                    y: 0
                };
                if(p.curve === undefined) p.curve = false;
            });
        }
        const pts = this.selectedShape.points;
        const smooth = smoothness || 0.3;
        for(let i = 1; i < pts.length - 1; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const next = pts[i + 1];
            const toPrev = {
                x: prev.x - curr.x,
                y: prev.y - curr.y
            };
            const toNext = {
                x: next.x - curr.x,
                y: next.y - curr.y
            };
            const distPrev = Math.hypot(toPrev.x, toPrev.y);
            const distNext = Math.hypot(toNext.x, toNext.y);
            if(distPrev < 0.1 || distNext < 0.1) continue;
            const handleLen = Math.min(distPrev, distNext) * smooth;
            curr.in = {
                x: (toPrev.x / distPrev) * handleLen,
                y: (toPrev.y / distPrev) * handleLen
            };
            curr.out = {
                x: (toNext.x / distNext) * handleLen,
                y: (toNext.y / distNext) * handleLen
            };
            curr.curve = true;
        }
        if(pts.length > 2) {
            const first = pts[0];
            const last = pts[pts.length - 1];
            const isClosed = (
                Math.abs(first.x - last.x) < 0.1 &&
                Math.abs(first.y - last.y) < 0.1
            );
            if(isClosed && pts.length > 2) {
                const prev = pts[pts.length - 2];
                const curr = pts[0];
                const next = pts[1];
                const toPrev = {
                    x: prev.x - curr.x,
                    y: prev.y - curr.y
                };
                const toNext = {
                    x: next.x - curr.x,
                    y: next.y - curr.y
                };
                const distPrev = Math.hypot(toPrev.x, toPrev.y);
                const distNext = Math.hypot(toNext.x, toNext.y);
                if(distPrev > 0.1 && distNext > 0.1) {
                    const handleLen = Math.min(distPrev, distNext) * smooth;
                    curr.in = {
                        x: (toPrev.x / distPrev) * handleLen,
                        y: (toPrev.y / distPrev) * handleLen
                    };
                    curr.out = {
                        x: (toNext.x / distNext) * handleLen,
                        y: (toNext.y / distNext) * handleLen
                    };
                    curr.curve = true;
                }
            }
        }
        if(!preview) {
            this._originalPoints = null;
            this.redraw();
            showToast(`Corners smoothed (${Math.round(smooth * 100)}%)`, 'S');
        } else {
            this.redraw();
        }
    }
    cancelSmoothPreview() {
        if(this._originalPoints && this.selectedShape) {
            this.selectedShape.points = this._originalPoints;
            this._originalPoints = null;
            this.redraw();
        }
    }
    applySmoothPreview() {
        this._originalPoints = null;
    }
    initSmoothnessSlider() {
        const container = document.getElementById('smoothnessSliderContainer');
        if(!container) return;
        this.smoothnessValue = this.smoothnessValue || 0.3;
        container.innerHTML = '';
        const sliderWrapper = createRNSlider({
            label: `Smoothness (${Math.round(this.smoothnessValue * 100)}%)`,
            value: this.smoothnessValue,
            min: 0.1,
            max: 1.0,
            step: 0.05,
            orientation: 'horizontal',
            width: 280,
            height: 50,
            onChange: (v) => {
                this.smoothnessValue = v;
                if(this.selectedShape && !this.selectedShape.finished) {
                    this.smoothCorners(v, true);
                }
            },
            onCommit: (start, end) => {
                this.smoothCorners(end, false);
            }
        });
        container.appendChild(sliderWrapper);
        container.style.display = 'block';
    }
}