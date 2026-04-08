const viewport = {
    scale: 1,
    panning: false,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,
    mode: 'object'
};
let scrubPending = false;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('animContainer');
const settingsModal = document.getElementById('settingsModal');
const shapeModal = document.getElementById('shapeModal');
const btnSettings = document.getElementById('btnSettings');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const btnAddShape = document.getElementById('btnAddShape');
const btnAddText = document.getElementById('btnAddText');
const btnAddImage = document.getElementById('btnAddImage');
const imageInput = document.getElementById('imageInput');
const closeShapeModalBtn = document.getElementById('closeShapeModalBtn');
const shapeOptions = document.querySelectorAll('.shape-option');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const btnPlay = document.getElementById('btnPlay');
const btnPause = document.getElementById('btnPause');
const btnStop = document.getElementById('btnStop');
const timeDisplay = document.getElementById('timeDisplay');
const durationDisplay = document.getElementById('durationDisplay');
const btnModeObject = document.getElementById('btnModeObject');
const btnModeCanvas = document.getElementById('btnModeCanvas');
const btnExportVideo = document.getElementById('btnExportVideo');
const exportStatus = document.getElementById('exportStatus');
const btnOpenEditModal = document.getElementById('btnOpenEditModal');
const btnCancelEdit = document.getElementById('btnCancelEdit');
const timelineRuler = document.getElementById("timelineRuler");
const trackLabels = document.getElementById("trackLabels");
const timelineTracks = document.getElementById("timelineTracks");
const timelineTracksWrapper = document.getElementById("timelineTracksWrapper");
const playhead = document.getElementById("timelinePlayhead");
const timelineContainer = document.getElementById("timelineContainer");
const playerTime = document.getElementById("playerTime");
const resizeHandle = document.getElementById("timelineResizeHandle");
const btnPencil = document.getElementById('btnPencil');

let selectionToolActive = true;
let timelineResizing = false;
let startY = 0;
let startHeight = 0;
let mediaRecorder;
let recordedChunks = [];
let shapes = [];
let selectedShape = null;
let isDragging = false,
    isScaling = false,
    isRotating = false,
    isStretching = false;
let stretchAxis = null,
    dragOffset = {
        x: 0,
        y: 0
    },
    startAngle = 0;
let startScale = {
        x: 1,
        y: 1
    },
    startMouseDist = 0,
    activeHandle = null;
let startSkew = {
    x: 0,
    y: 0
};
let startSkewMouse = {
    x: 0,
    y: 0
};
let shapeManager;
let animationFrameId;
let isDraggingPivot = false;
let dragOffsetPivot = {
    x: 0,
    y: 0
};
let rotationPivotWorld = null;
let rotationBaseValue = 0;
let rotationStartAngle = 0;
let rotationCenterX = 0;
let rotationCenterY = 0;
let accumulatedDelta = 0;
let lastMouseAngle = 0;
let isUndoRedoInProgress = false;
let lastDrawTime = -1;
let pixelsPerSecond = 120;
const subdivisions = 10;
let timelineDragging = false;
let timelineDragStartX = 0;
let timelineScrollStart = 0;
let shapeColorIndex = 0;
let penMode = false;
let pencilMode = false;
let isDrawingPencil = false;
let pencilShape = null;
let pencilPoints = [];
let pencilLastPos = {
    x: 0,
    y: 0
};
let pencilMinDistance = 1;
let pencilStrokeWidth = 3;
let pencilSmoothness = 0.3;
let pencilFinished = false;
let currentDrawingTool = null;
let isDrawing = false;
let isErasing = false;
let allStrokes = [];
let currentStrokePoints = [];
let eraserStrokePoints = [];
let drawingStrokeWidth = 2;
let eraserStrokeWidth = 20;
let drawingStrokeColor = '#00d4ff';
let drawingStrokeOpacity = 1;
let currentStrokeWidth = 2;
let currentStrokeColor = '#00d4ff';
let currentStrokeOpacity = 1;
let drawingCanvas = null;
let drawingCtx = null;
let drawingStartState = null;
let erasedShapesData = null;
let selectedShapes = [];
let isMarqueeActive = false;
let marqueeStart = {
    x: 0,
    y: 0
};
let marqueeEnd = {
    x: 0,
    y: 0
};
let marqueeStartScreen = {
    x: 0,
    y: 0
};
let groupCounter = 1;
let isEditingPoint = false;
let isEditingPolyline = false;
let fillBucketTool = false;
let fillColor = '#00d4ff';
let minTaperWidth = 1;
let maxTaperWidth = 10;
let brushSpacing = 5;
let glowIntensity = 10;
let gradientColors = ['#00d4ff', '#ff9f43'];
let stabilizationLevel = 5;
let rawPointsBuffer = [];
let stabilizationTimer = null;
let currentSmoothing = 'weighted';
let strokeHardness = 100;
let eraserPoints = [];
let eraserHardness = 100;

window.animationState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    fps: 60,
    lastFrameTime: 0,
    settings: {
        projectName: "RM Studio Project",
        width: 1280,
        height: 720,
        bgColor: "#0fff0f",
        transparent: false,
        keyframeStep: 1.0,
        interpolate: true,
        easing: "linear"
    }
};
window.seekAnimation = (time) => {
    window.animationState.currentTime = Math.max(0, Math.min(time, window.animationState.duration));
    shapes.forEach(s => {
        s._kfIndex = 0;
        s._lastTime = -1;
    });
    updateTimelineUI();
    interpolateAndDraw();
};

function selectShape(shape) {
    shapes.forEach(s => s.selected = false);
    selectedShapes = [];
    if(shape) {
        shape.selected = true;
        selectedShapes = [shape];
        selectedShape = shape;
        if(shapeManager) shapeManager.setSelectedShape(shape);
    } else {
        selectedShape = null;
        if(shapeManager) shapeManager.setSelectedShape(null);
    }
    drawAll();
}

function clearSelection() {
    if(selectedShapes && selectedShapes.length > 0) {
        selectedShapes.forEach(shape => {
            if(shape) shape.selected = false;
        });
        selectedShapes = [];
    }
    if(selectedShape) {
        selectedShape.selected = false;
        selectedShape = null;
    }
    lastSelectedShape = null;
    if(typeof isMarqueeActive !== 'undefined') {
        isMarqueeActive = false;
        marqueeStart = null;
        const marquee = document.getElementById('marqueeSelect');
        if(marquee) marquee.remove();
    }
    if(shapeManager) {
        shapeManager.setSelectedShape(null);
    }
    if(typeof drawAll === 'function') {
        drawAll();
    }
}
