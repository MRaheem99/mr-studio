    const viewport = {
        scale: 1,
        panning: false,
        pointX: 0,
        pointY: 0,
        startX: 0,
        startY: 0,
        mode: 'object',
        startDist: null,
        startScale: null,
        startCenterX: null,
        startCenterY: null
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
    const rulerCntainer = document.getElementById('ruler-container');
    
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
    let subdivisions = 10;
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
    let drawingStrokeColor = '#0066ff';
    let drawingStrokeOpacity = 1;
    let currentStrokeWidth = 2;
    let currentStrokeColor = '#0066ff';
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
    let fillColor = '#ff0066';
    let minTaperWidth = 1;
    let maxTaperWidth = 10;
    let brushSpacing = 5;
    let glowIntensity = 10;
    let gradientColors = ['#ff0066', '#a64dff'];
    let stabilizationLevel = 5;
    let rawPointsBuffer = [];
    let stabilizationTimer = null;
    let currentSmoothing = 'weighted';
    let strokeHardness = 100;
    let eraserPoints = [];
    let eraserHardness = 100;
    let bookmarks = [];
    let loopEnabled = false;
    let loopStartTime = 0;
    let loopEndTime = 5;
    let selectedBookmark = null;
    let soloEditMode = false;
    let soloEditObject = null;
    let lockedObjects = new Set();
    let originalHierarchy = [];
    let autoExtendEnabled = false;
    let autoExtendThreshold = 100;
    let activeTooltip = null;
    let tooltipTimeout = null;
    let timelineZoomLevel = 1;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.1;
    let copiedKeyframe = null;
    let copiedKeyframeSourceShape = null;
    let timelineHoverLineRuler = null;
    let timelineHoverLineWrapper = null;
    let timelineHoverTooltip = null;
    let lastMouseX = null;
    
    let initialPinchDistance = 0;
    let initialPinchScale = 1;
    let initialPinchPointX = 0;
    let initialPinchPointY = 0;
    let initialViewportPointX = 0;
    let initialViewportPointY = 0;
    let isPinching = false;
    
    let touchPanStartX = 0, touchPanStartY = 0;
    let touchPanStartPointX = 0, touchPanStartPointY = 0;
    let isTouchPanning = false;
    
    let timelineTouchStartX = 0;
    let timelineTouchStartScrollLeft = 0;
    let isTimelineTouching = false;
    let isRulerTouching = false;
    let touchStartTime = 0;
    let touchMoved = false;
    const LONG_PRESS_DURATION = 500;
    const MOVE_THRESHOLD = 10;
    
    const FONT_LIST = [
        { value: "Arial, Helvetica, sans-serif", display: "Arial", category: "system" },
        { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", display: "Helvetica", category: "system" },
        { value: "Verdana, Geneva, sans-serif", display: "Verdana", category: "system" },
        { value: "'Times New Roman', Times, serif", display: "Times New Roman", category: "system" },
        { value: "Georgia, 'Times New Roman', serif", display: "Georgia", category: "system" },
        { value: "'Courier New', Courier, monospace", display: "Courier New", category: "system" },
        { value: "'Comic Sans MS', 'Chalkboard SE', cursive", display: "Comic Sans MS", category: "system" },
        { value: "Impact, 'Arial Black', sans-serif", display: "Impact", category: "system" },
        { value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif", display: "Lucida Sans", category: "system" },
        { value: "Tahoma, Geneva, sans-serif", display: "Tahoma", category: "system" },
        { value: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif", display: "Trebuchet MS", category: "system" },
        { value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", display: "Palatino", category: "system" },
        { value: "'Roboto', sans-serif", display: "Roboto", category: "google" },
        { value: "'Open Sans', sans-serif", display: "Open Sans", category: "google" },
        { value: "'Montserrat', sans-serif", display: "Montserrat", category: "google" },
        { value: "'Poppins', sans-serif", display: "Poppins", category: "google" },
        { value: "'Playfair Display', serif", display: "Playfair Display", category: "google" },
        { value: "'Merriweather', serif", display: "Merriweather", category: "google" },
        { value: "'Pacifico', cursive", display: "Pacifico", category: "google" },
        { value: "'Lobster', cursive", display: "Lobster", category: "google" },
        { value: "'Ubuntu', sans-serif", display: "Ubuntu", category: "google" },
        { value: "'Lato', sans-serif", display: "Lato", category: "google" },
        { value: "'Nunito', sans-serif", display: "Nunito", category: "google" },
        { value: "'Oswald', sans-serif", display: "Oswald", category: "google" },
        { value: "'Raleway', sans-serif", display: "Raleway", category: "google" },
        { value: "'Quicksand', sans-serif", display: "Quicksand", category: "google" }
    ];
    
    window.animationState = {
        isPlaying: false,
        currentTime: 0,
        duration: 60,
        animationDuration: 60,
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
        if (shape) {
            shape.selected = true;
            selectedShapes = [shape];
            selectedShape = shape;
            if (shapeManager) shapeManager.setSelectedShape(shape);
        } else {
            selectedShape = null;
            if (shapeManager) shapeManager.setSelectedShape(null);
        }
        drawAll();
    }
    
    function selectShapes(shapesToSelect, addToSelection = false) {
        if (!shapesToSelect || shapesToSelect.length === 0) return;
    
        if (!addToSelection) {
            for (let i = 0; i < selectedShapes.length; i++) {
                if (selectedShapes[i]) selectedShapes[i].selected = false;
            }
            selectedShapes = [];
        }
    
        for (let i = 0; i < shapesToSelect.length; i++) {
            const shape = shapesToSelect[i];
            if (shape && !selectedShapes.includes(shape)) {
                selectedShapes.push(shape);
                shape.selected = true;
            }
        }
    
        if (selectedShapes.length > 0) {
            selectedShape = selectedShapes[selectedShapes.length - 1];
            lastSelectedShape = selectedShape;
            if (shapeManager) shapeManager.setSelectedShape(selectedShape);
        }
    
        drawAll();
    }
    
    function clearSelection() {
        if (selectedShapes && selectedShapes.length > 0) {
            selectedShapes.forEach(shape => {
                if (shape) shape.selected = false;
            });
            selectedShapes = [];
        }
        if (selectedShape) {
            selectedShape.selected = false;
            selectedShape = null;
        }
        lastSelectedShape = null;
        if (typeof isMarqueeActive !== 'undefined') {
            isMarqueeActive = false;
            marqueeStart = null;
            const marquee = document.getElementById('marqueeSelect');
            if (marquee) marquee.remove();
        }
        if (shapeManager) {
            shapeManager.setSelectedShape(null);
        }
        if (typeof drawAll === 'function') {
            drawAll();
        }
    }
