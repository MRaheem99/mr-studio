
let shapeLibrary = [];
async function initShapeLibrary() {
    try {
        const response = await fetch('./js/lib/shapes.json');
        if (response.ok) {
            shapeLibrary = await response.json();
            console.log("Shape library loaded:", shapeLibrary.length, "shapes");
        } else {
            console.log("No shapes.json found, using default library");
            shapeLibrary = getDefaultLibrary();
        }
    } catch (error) {
        console.log("Error loading shapes.json, using default library");
        shapeLibrary = getDefaultLibrary();
    }
}

function getDefaultLibrary() {
    return [{
            name: "Star",
            type: "star",
            size: 80,
            color: "#ffd700",
            borderColor: "#ffaa00",
            borderWidth: 2
        },
        {
            name: "Heart",
            type: "path",
            size: 80,
            color: "#ff6b6b",
            borderColor: "#ff4444",
            borderWidth: 2,
            points: [
                { x: 0, y: -30 }, { x: 20, y: -50 }, { x: 40, y: -30 },
                { x: 40, y: 0 }, { x: 0, y: 40 }, { x: -40, y: 0 },
                { x: -40, y: -30 }, { x: -20, y: -50 }, { x: 0, y: -30 }
            ]
        },
        {
            name: "Cloud",
            type: "path",
            size: 100,
            color: "#ffffff",
            borderColor: "#cccccc",
            borderWidth: 2,
            points: [
                { x: -40, y: 0 }, { x: -30, y: -20 }, { x: -10, y: -30 },
                { x: 10, y: -25 }, { x: 30, y: -15 }, { x: 40, y: 0 },
                { x: 30, y: 15 }, { x: -30, y: 15 }, { x: -40, y: 0 }
            ]
        },
        {
            name: "Arrow Right",
            type: "arrow",
            size: 70,
            color: "#00d4ff",
            borderColor: "#0099cc",
            borderWidth: 2
        },
        {
            name: "Pentagon",
            type: "pentagon",
            size: 70,
            color: "#4ecdc4",
            borderColor: "#2d9c93",
            borderWidth: 2
        },
        {
            name: "Smile Face",
            type: "drawing",
            size: 100,
            color: "#ffd166",
            borderColor: "#ffaa00",
            borderWidth: 2,
            strokesData: [{
                    points: [
                        { x: -30, y: -10 }, { x: -20, y: -20 }, { x: -10, y: -25 },
                        { x: 0, y: -25 }, { x: 10, y: -20 }, { x: 20, y: -10 }
                    ],
                    brushType: "solid",
                    width: 3,
                    color: "#333333"
                },
                {
                    points: [
                        { x: -25, y: 15 }, { x: -15, y: 25 }, { x: 0, y: 30 },
                        { x: 15, y: 25 }, { x: 25, y: 15 }
                    ],
                    brushType: "solid",
                    width: 3,
                    color: "#333333"
                },
                {
                    points: [
                        { x: -15, y: -5 }, { x: -10, y: -8 }
                    ],
                    brushType: "solid",
                    width: 4,
                    color: "#333333"
                },
                {
                    points: [
                        { x: 15, y: -5 }, { x: 10, y: -8 }
                    ],
                    brushType: "solid",
                    width: 4,
                    color: "#333333"
                }
            ]
        }
    ];
}

function saveShapeAsPreset() {
    if (!selectedShape) {
        showToast("No shape selected to save", 'E');
        return;
    }
    const preset = {
        name: showPrompt("Enter preset name:", `${selectedShape.type}_${Date.now()}`, (newName) => { if (!newName) return; }),
        date: new Date().toISOString(),
        type: selectedShape.type,
        size: selectedShape.size,
        color: selectedShape.color,
        borderColor: selectedShape.borderColor,
        borderWidth: selectedShape.borderWidth,
        opacity: selectedShape.opacity,
        shadowColor: selectedShape.shadowColor,
        shadowBlur: selectedShape.shadowBlur,
        shadowOffsetX: selectedShape.shadowOffsetX,
        shadowOffsetY: selectedShape.shadowOffsetY,
        shadowOpacity: selectedShape.shadowOpacity,
        rotation: selectedShape.rotation,
        scaleX: selectedShape.scaleX,
        scaleY: selectedShape.scaleY
    };
    if (selectedShape.type === 'text') {
        preset.text = selectedShape.text;
        preset.fontSize = selectedShape.fontSize;
        preset.fontFamily = selectedShape.fontFamily;
    }
    if (selectedShape.type === 'drawing' && selectedShape.strokesData) {
        preset.strokesData = JSON.parse(JSON.stringify(selectedShape.strokesData));
        preset.strokeFillColors = selectedShape.strokeFillColors;
    }
    if (selectedShape.type === 'polyline' || selectedShape.type === 'path') {
        preset.points = JSON.parse(JSON.stringify(selectedShape.points));
    }
    if (selectedShape.type === 'polygon') {
        preset.sides = selectedShape.sides;
    }
    if (selectedShape.bgImage) {
        preset.bgImage = selectedShape.bgImage;
    }
    const jsonStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name}.shape.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Preset "${preset.name}" saved!`, 'S');
}

function loadShapeFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const preset = JSON.parse(e.target.result);
            createShapeFromPreset(preset);
        } catch (error) {
            showToast("Invalid preset file", 'E');
        }
    };
    reader.readAsText(file);
}

function createShapeFromPreset(preset) {
    let shape;
    if (preset.type === 'drawing') {
        shape = new Shape('drawing', canvas.width / 2, canvas.height / 2, preset.size || 100);
        if (preset.strokesData) {
            shape.strokesData = JSON.parse(JSON.stringify(preset.strokesData));
        }
        if (preset.strokeFillColors) {
            shape.strokeFillColors = preset.strokeFillColors;
        }
    } else if (preset.type === 'text') {
        shape = new Shape('text', canvas.width / 2, canvas.height / 2, preset.size || 100);
        shape.text = preset.text || "Hello";
        shape.fontSize = preset.fontSize || 40;
        shape.fontFamily = preset.fontFamily || "Arial";
    } else if (preset.type === 'polyline' || preset.type === 'path') {
        shape = new Shape(preset.type, canvas.width / 2, canvas.height / 2, preset.size || 100);
        if (preset.points) {
            shape.points = JSON.parse(JSON.stringify(preset.points));
        }
    } else {
        shape = new Shape(preset.type, canvas.width / 2, canvas.height / 2, preset.size || 100);
    }
    shape.color = preset.color || getRandomColor();
    shape.borderColor = preset.borderColor || '#ffffff';
    shape.borderWidth = preset.borderWidth || 0;
    shape.opacity = preset.opacity !== undefined ? preset.opacity : 1;
    shape.shadowColor = preset.shadowColor || '#000000';
    shape.shadowBlur = preset.shadowBlur || 0;
    shape.shadowOffsetX = preset.shadowOffsetX || 0;
    shape.shadowOffsetY = preset.shadowOffsetY || 0;
    shape.shadowOpacity = preset.shadowOpacity !== undefined ? preset.shadowOpacity : 0.5;
    shape.rotation = preset.rotation || 0;
    shape.scaleX = preset.scaleX || 1;
    shape.scaleY = preset.scaleY || 1;
    if (preset.type === 'polygon') {
        shape.sides = preset.sides || 5;
    }
    shapes.push(shape);
    selectShape(shape);
    drawAll();
    rebuildTracks();
    showToast(`Loaded preset: ${preset.name}`, 'S');
}

function showShapeLibrary() {
    const container = document.getElementById('shapeLibraryContainer');
    if (!container) return;
    container.innerHTML = '';
    shapeLibrary.forEach((preset, index) => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            border: 1px solid var(--border);
        `;
        card.onmouseenter = () => {
            card.style.borderColor = 'var(--accent)';
            card.style.background = 'rgba(0,212,255,0.1)';
        };
        card.onmouseleave = () => {
            card.style.borderColor = 'var(--border)';
            card.style.background = 'rgba(255,255,255,0.05)';
        };
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 80;
        previewCanvas.height = 80;
        previewCanvas.style.width = '80px';
        previewCanvas.style.height = '80px';
        previewCanvas.style.margin = '0 auto';
        previewCanvas.style.display = 'block';
        previewCanvas.style.background = '#1a1a1a';
        previewCanvas.style.borderRadius = '4px';
        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, 80, 80);
        ctx.fillStyle = preset.color || '#00d4ff';
        if (preset.type === 'square') {
            ctx.fillRect(20, 20, 40, 40);
        } else if (preset.type === 'circle') {
            ctx.beginPath();
            ctx.arc(40, 40, 20, 0, Math.PI * 2);
            ctx.fill();
        } else if (preset.type === 'star') {
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const x = 40 + Math.cos(angle) * 25;
                const y = 40 + Math.sin(angle) * 25;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(25, 25, 30, 30);
        }
        card.appendChild(previewCanvas);
        const nameSpan = document.createElement('div');
        nameSpan.textContent = preset.name;
        nameSpan.style.cssText = `
            margin-top: 8px;
            font-size: 0.8rem;
            color: var(--text-main);
        `;
        card.appendChild(nameSpan);
        card.onclick = () => {
            createShapeFromPreset(preset);
            const libraryModal = document.getElementById('shapeLibraryModal');
            if (libraryModal) libraryModal.classList.remove('open');
        };
        container.appendChild(card);
    });
}
initShapeLibrary();
document.addEventListener('DOMContentLoaded', () => {
    const btnSavePreset = document.getElementById('btnSavePreset');
    const btnLoadPreset = document.getElementById('btnLoadPreset');
    const btnShapeLibrary = document.getElementById('btnShapeLibrary');
    const presetFileInput = document.getElementById('presetFileInput');
    const btnChooseFile = document.getElementById('btnChooseFile');
    const closeLibraryBtn = document.getElementById('closeLibraryBtn');
    const closeLoadPresetBtn = document.getElementById('closeLoadPresetBtn');
    const libraryModal = document.getElementById('shapeLibraryModal');
    const loadPresetModal = document.getElementById('loadPresetModal');
    if (btnSavePreset) {
        btnSavePreset.addEventListener('click', saveShapeAsPreset);
    }
    if (btnLoadPreset) {
        btnLoadPreset.addEventListener('click', () => {
            if (loadPresetModal) openPopup(loadPresetModal);
        });
    }
    if (btnShapeLibrary) {
        btnShapeLibrary.addEventListener('click', () => {
            showShapeLibrary();
            if (libraryModal) openPopup(libraryModal);
        });
    }
    if (btnChooseFile && presetFileInput) {
        btnChooseFile.addEventListener('click', () => {
            presetFileInput.click();
        });
        presetFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                loadShapeFromFile(e.target.files[0]);
                if (loadPresetModal) loadPresetModal.classList.remove('open');
            }
        });
    }
    if (closeLibraryBtn && libraryModal) {
        closeLibraryBtn.addEventListener('click', () => {
            libraryModal.classList.remove('open');
        });
    }
    if (closeLoadPresetBtn && loadPresetModal) {
        closeLoadPresetBtn.addEventListener('click', () => {
            loadPresetModal.classList.remove('open');
        });
    }
});
