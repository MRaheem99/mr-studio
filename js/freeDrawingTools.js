const brushTypes = {
    SOLID: 'solid',
    TAPERED: 'tapered',
    DOTTED: 'dotted',
    DASHED: 'dashed',
    WAVY: 'wavy',
    ZIGZAG: 'zigzag',
    GLOW: 'glow',
    GRADIENT: 'gradient',
    TEXTURE: 'texture'
};

let currentBrushType = brushTypes.SOLID;

function initDrawingCanvas() {
    drawingCanvas = document.createElement('canvas');
    drawingCanvas.id = 'drawingCanvas';
    drawingCanvas.style.position = 'absolute';
    drawingCanvas.style.top = '0';
    drawingCanvas.style.left = '0';
    drawingCanvas.style.pointerEvents = 'none';
    drawingCanvas.style.zIndex = '100';
    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;
    drawingCanvas.style.width = canvas.style.width;
    drawingCanvas.style.height = canvas.style.height;
    drawingCanvas.style.transform = canvas.style.transform;
    drawingCanvas.style.transformOrigin = canvas.style.transformOrigin;
    container.appendChild(drawingCanvas);
    drawingCtx = drawingCanvas.getContext('2d');
}

function syncDrawingCanvasTransform() {
    if(!drawingCanvas) return;
    drawingCanvas.style.transform = canvas.style.transform;
    drawingCanvas.style.transformOrigin = canvas.style.transformOrigin;
}

function clearDrawingCanvas() {
    if(drawingCtx) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
}

function getCanvasMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    return {
        x: relativeX * canvas.width,
        y: relativeY * canvas.height
    };
}

function drawStroke(ctx, points, width, color, opacity, brushType, taperStart = null, taperEnd = null) {
    if(points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    
    if(strokeHardness < 100 && brushType !== brushTypes.TAPERED) {
        const blurAmount = (100 - strokeHardness) / 10;
        ctx.shadowBlur = blurAmount;
        ctx.shadowColor = color;
    }
    
    switch(brushType) {
        case brushTypes.SOLID:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            break;
            
        case brushTypes.TAPERED:
            if(taperStart === null) taperStart = minTaperWidth;
            if(taperEnd === null) taperEnd = maxTaperWidth;
            
            const totalPoints = points.length;
            if(totalPoints < 2) break;
            
            ctx.beginPath();
            for(let i = 0; i < totalPoints; i++) {
                const p = points[i];
                const t = i / (totalPoints - 1);
                let w;
                if(t < 0.5) {
                    w = (taperStart + (width - taperStart) * (t * 2)) / 2;
                } else {
                    w = (width - (width - taperEnd) * ((t - 0.5) * 2)) / 2;
                }
                if(i === 0) ctx.moveTo(p.x, p.y - w);
                else ctx.lineTo(p.x, p.y - w);
            }
            for(let i = totalPoints - 1; i >= 0; i--) {
                const p = points[i];
                const t = i / (totalPoints - 1);
                let w;
                if(t < 0.5) {
                    w = (taperStart + (width - taperStart) * (t * 2)) / 2;
                } else {
                    w = (width - (width - taperEnd) * ((t - 0.5) * 2)) / 2;
                }
                ctx.lineTo(p.x, p.y + w);
            }
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            break;
            
        case brushTypes.DOTTED:
            const dotDist = Math.max(width * 2, 5);
            let lastPoint = points[0];
            for(let i = 1; i < points.length; i++) {
                const p = points[i];
                const dist = Math.hypot(p.x - lastPoint.x, p.y - lastPoint.y);
                let remaining = dist;
                while(remaining > 0) {
                    const step = Math.min(remaining, dotDist);
                    const t = step / dist;
                    const x = lastPoint.x + (p.x - lastPoint.x) * t;
                    const y = lastPoint.y + (p.y - lastPoint.y) * t;
                    ctx.beginPath();
                    ctx.arc(x, y, width / 3, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    remaining -= step;
                }
                lastPoint = p;
            }
            break;
            
        case brushTypes.DASHED:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.setLineDash([width * 3, width * 2]);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.setLineDash([]);
            break;
            
        case brushTypes.WAVY:
            ctx.beginPath();
            const amplitude = width / 2;
            for(let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const perpX = -Math.sin(angle);
                const perpY = Math.cos(angle);
                const steps = Math.max(5, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 5));
                for(let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const x = p1.x + (p2.x - p1.x) * t;
                    const y = p1.y + (p2.y - p1.y) * t;
                    const offset = Math.sin(t * Math.PI * 4) * amplitude;
                    const wx = x + perpX * offset;
                    const wy = y + perpY * offset;
                    if(i === 0 && s === 0) ctx.moveTo(wx, wy);
                    else ctx.lineTo(wx, wy);
                }
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width / 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            break;
            
        case brushTypes.ZIGZAG:
            ctx.beginPath();
            const zigAmp = width / 2;
            for(let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const perpX = -Math.sin(angle);
                const perpY = Math.cos(angle);
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                const zigX = midX + perpX * zigAmp;
                const zigY = midY + perpY * zigAmp;
                if(i === 0) ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(zigX, zigY);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width / 2;
            ctx.stroke();
            break;
            
        case brushTypes.GLOW:
            ctx.shadowColor = color;
            ctx.shadowBlur = glowIntensity;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.shadowBlur = 0;
            break;
            
        case brushTypes.GRADIENT:
            const grad = ctx.createLinearGradient(points[0].x, points[0].y, points[points.length-1].x, points[points.length-1].y);
            grad.addColorStop(0, gradientColors[0]);
            grad.addColorStop(1, gradientColors[1]);
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = grad;
            ctx.lineWidth = width;
            ctx.stroke();
            break;
            
        case brushTypes.TEXTURE:
            ctx.fillStyle = color;
            const texSpacing = Math.max(width / 2, 3);
            for(let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const steps = Math.ceil(dist / texSpacing);
                for(let s = 0; s <= steps; s++) {
                    const t = s / steps;
                    const x = p1.x + (p2.x - p1.x) * t;
                    const y = p1.y + (p2.y - p1.y) * t;
                    for(let dx = -width/2; dx <= width/2; dx += width/3) {
                        for(let dy = -width/2; dy <= width/2; dy += width/3) {
                            ctx.fillRect(x + dx, y + dy, width/4, width/4);
                        }
                    }
                }
            }
            break;
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawEraserStroke(ctx, points, width) {
    if(points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
}

function redrawAllStrokes() {
    if(!drawingCtx) return;
    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;
    drawingCanvas.style.width = canvas.style.width;
    drawingCanvas.style.height = canvas.style.height;
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    for(let strokeData of allStrokes) {
        drawStroke(drawingCtx, strokeData.points, strokeData.width, strokeData.color,
            strokeData.opacity, strokeData.brushType, strokeData.taperStart, strokeData.taperEnd);
    }
    if(currentStrokePoints.length >= 2) {
        if(currentDrawingTool === 'eraser') {
            // For eraser preview, show red stroke
            drawingCtx.save();
            drawingCtx.beginPath();
            drawingCtx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
            for(let i = 1; i < currentStrokePoints.length; i++) {
                drawingCtx.lineTo(currentStrokePoints[i].x, currentStrokePoints[i].y);
            }
            drawingCtx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
            drawingCtx.lineWidth = eraserStrokeWidth;
            drawingCtx.lineCap = 'round';
            drawingCtx.lineJoin = 'round';
            drawingCtx.stroke();
            drawingCtx.restore();
        } else {
            drawStroke(drawingCtx, currentStrokePoints, currentStrokeWidth, currentStrokeColor,
                currentStrokeOpacity, currentBrushType, minTaperWidth, maxTaperWidth);
        }
    }
}

function eraseWithEraser(points, width) {
    if(points.length < 2) return false;
    
    let anyChange = false;
    const eraserRadius = width / 2;
    
    for(let s = 0; s < shapes.length; s++) {
        const shape = shapes[s];
        
        if(shape.type === 'drawing' && shape.strokesData) {
            const newStrokes = [];
            
            for(let stroke of shape.strokesData) {
                const newPoints = [];
                const strokePoints = stroke.points;
                
                for(let i = 0; i < strokePoints.length - 1; i++) {
                    const p1 = strokePoints[i];
                    const p2 = strokePoints[i + 1];
                    const wp1 = shape.localToWorld(p1.x, p1.y);
                    const wp2 = shape.localToWorld(p2.x, p2.y);
                    
                    let isErased = false;
                    
                    for(let j = 0; j < points.length - 1; j++) {
                        const e1 = points[j];
                        const e2 = points[j + 1];
                        
                        const dist = distanceSegmentToSegment(wp1, wp2, e1, e2);
                        if(dist < eraserRadius) {
                            isErased = true;
                            break;
                        }
                    }
                    
                    if(!isErased) {
                        if(newPoints.length === 0) {
                            newPoints.push(p1);
                        }
                        newPoints.push(p2);
                    } else {
                        anyChange = true;
                        if(newPoints.length >= 2) {
                            newStrokes.push({ ...stroke, points: [...newPoints] });
                        }
                        newPoints.length = 0;
                    }
                }
                
                if(newPoints.length >= 2) {
                    newStrokes.push({ ...stroke, points: newPoints });
                } else if(newPoints.length === 0 && !anyChange) {
                    newStrokes.push(stroke);
                } else {
                    anyChange = true;
                }
            }
            
            if(newStrokes.length > 0) {
                shape.strokesData = newStrokes;
            } else {
                // Remove shape if no strokes left
                shapes.splice(s, 1);
                s--;
                anyChange = true;
            }
        }
    }
    
    return anyChange;
}

function smoothWeighted(points, windowSize) {
    if(points.length < windowSize) return points;
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    for(let i = 0; i < points.length; i++) {
        let sumX = 0, sumY = 0, count = 0;
        for(let j = Math.max(0, i - halfWindow); j <= Math.min(points.length - 1, i + halfWindow); j++) {
            sumX += points[j].x;
            sumY += points[j].y;
            count++;
        }
        smoothed.push({ x: sumX / count, y: sumY / count });
    }
    return smoothed;
}

function stabilizeStroke(rawPoints) {
    if(rawPoints.length < 3) return rawPoints;
    let smoothed = [...rawPoints];
    if(stabilizationLevel > 0) {
        const windowSize = Math.max(3, Math.min(21, stabilizationLevel));
        smoothed = smoothWeighted(smoothed, windowSize);
    }
    return smoothed;
}

function startDrawingStabilized(e) {
    if(!currentDrawingTool) return;
    if(window.animationState.isPlaying) return;
    e.preventDefault();
    
    if(selectedShape) {
        selectedShape.selected = false;
        selectedShape = null;
    }
    if(selectedShapes && selectedShapes.length > 0) {
        selectedShapes.forEach(s => s.selected = false);
        selectedShapes = [];
    }
    if(shapeManager) shapeManager.setSelectedShape(null);
    if(window.undoManager) {
        drawingStartState = {
            allStrokes: JSON.parse(JSON.stringify(allStrokes)),
            currentStrokePoints: []
        };
    }
    const pos = getCanvasMousePosition(e);
    isDrawing = true;
    rawPointsBuffer = [{ x: pos.x, y: pos.y }];
    currentStrokePoints = [{ x: pos.x, y: pos.y }];
    redrawAllStrokes();
}

function continueDrawingStabilized(e) {
    if(!isDrawing || !currentDrawingTool) return;
    e.preventDefault();
    const pos = getCanvasMousePosition(e);
    const lastPoint = rawPointsBuffer[rawPointsBuffer.length - 1];
    const distance = Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y);
    if(distance > 2) {
        rawPointsBuffer.push({ x: pos.x, y: pos.y });
        if(stabilizationTimer) clearTimeout(stabilizationTimer);
        stabilizationTimer = setTimeout(() => {
            if(rawPointsBuffer.length >= 3) {
                currentStrokePoints = stabilizeStroke(rawPointsBuffer);
                redrawAllStrokes();
            }
            stabilizationTimer = null;
        }, 10);
        if(rawPointsBuffer.length % 3 === 0) {
            currentStrokePoints = stabilizeStroke(rawPointsBuffer);
            redrawAllStrokes();
        }
    }
}

function endCurrentStrokeStabilized() {
    if(!isDrawing) return;
    if(stabilizationTimer) {
        clearTimeout(stabilizationTimer);
        stabilizationTimer = null;
    }
    if(rawPointsBuffer.length >= 2) {
        const finalStabilized = stabilizeStroke(rawPointsBuffer);
        if(finalStabilized.length >= 2) {
            if(currentDrawingTool === 'eraser') {
                // Erase from shapes
                const changed = eraseWithEraser(finalStabilized, eraserStrokeWidth);
                if(changed) {
                    drawAll();
                    rebuildTracks();
                }
            } else {
                const strokeData = {
                    points: finalStabilized,
                    width: currentStrokeWidth,
                    color: currentStrokeColor,
                    opacity: currentStrokeOpacity,
                    brushType: currentBrushType
                };
                if(currentBrushType === brushTypes.TAPERED) {
                    strokeData.taperStart = minTaperWidth;
                    strokeData.taperEnd = maxTaperWidth;
                }
                allStrokes.push(strokeData);
            }
        }
    }
    rawPointsBuffer = [];
    currentStrokePoints = [];
    isDrawing = false;
    
    if(window.undoManager && drawingStartState && currentDrawingTool !== 'eraser') {
        const endState = {
            allStrokes: JSON.parse(JSON.stringify(allStrokes)),
            currentStrokePoints: []
        };
        if(JSON.stringify(drawingStartState.allStrokes) !== JSON.stringify(endState.allStrokes)) {
            const drawingCommand = new DrawingCommand(drawingStartState, endState);
            window.undoManager.execute(drawingCommand);
        }
        drawingStartState = null;
    }
    redrawAllStrokes();
    drawAll();
}

function distanceSegmentToSegment(a1, a2, b1, b2) {
    const d1 = pointToSegmentDistance(a1, b1, b2);
    const d2 = pointToSegmentDistance(a2, b1, b2);
    const d3 = pointToSegmentDistance(b1, a1, a2);
    const d4 = pointToSegmentDistance(b2, a1, a2);
    return Math.min(d1, d2, d3, d4);
}

function pointToSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    
    if(len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
    
    if(t < 0) return Math.hypot(p.x - a.x, p.y - a.y);
    if(t > 1) return Math.hypot(p.x - b.x, p.y - b.y);
    
    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    return Math.hypot(p.x - projX, p.y - projY);
}

function eraseStrokeFromShapes(points, width) {
    if(points.length < 2) return;
    
    const shapesBefore = JSON.parse(JSON.stringify(shapes.map(s => {
        if(s.type === 'drawing' && s.strokesData) {
            return { id: s.id, strokesData: s.strokesData };
        }
        return null;
    })));
    
    let anyChange = false;
    
    for(let shape of shapes) {
        if(shape.type === 'drawing' && shape.strokesData) {
            const newStrokes = [];
            
            for(let stroke of shape.strokesData) {
                const remainingPoints = eraseLineFromStroke(stroke.points, points, width);
                if(remainingPoints.length >= 2) {
                    newStrokes.push({ ...stroke, points: remainingPoints });
                } else {
                    anyChange = true;
                }
            }
            
            if(newStrokes.length !== shape.strokesData.length) {
                shape.strokesData = newStrokes;
                anyChange = true;
                if(shape.strokesData.length === 0) {
                    const index = shapes.indexOf(shape);
                    if(index !== -1) shapes.splice(index, 1);
                }
            }
        }
    }
    if(anyChange && window.undoManager) {
        const shapesAfter = JSON.parse(JSON.stringify(shapes.map(s => {
            if(s.type === 'drawing' && s.strokesData) {
                return { id: s.id, strokesData: s.strokesData };
            }
            return null;
        })));
        
        const eraseCommand = {
            execute: () => {},
            undo: () => {
                for(let i = 0; i < shapes.length; i++) {
                    if(shapes[i].type === 'drawing' && shapesAfter[i] && shapesAfter[i].strokesData) {
                        shapes[i].strokesData = shapesAfter[i].strokesData;
                    }
                }
                drawAll();
                rebuildTracks();
            }
        };
        window.undoManager.execute(eraseCommand);
    }
    
    drawAll();
    rebuildTracks();
}

function eraseLineFromStroke(strokePoints, eraserPoints, eraserWidth) {
    if(strokePoints.length < 2) return strokePoints;
    
    const result = [];
    let currentSegment = [];
    const eraserRadius = eraserWidth / 2;
    
    for(let i = 0; i < strokePoints.length - 1; i++) {
        const p1 = strokePoints[i];
        const p2 = strokePoints[i + 1];
        
        let segmentErased = false;
        
        for(let j = 0; j < eraserPoints.length - 1; j++) {
            const e1 = eraserPoints[j];
            const e2 = eraserPoints[j + 1];
            
            const distance = distanceBetweenSegments(p1, p2, e1, e2);
            if(distance < eraserRadius) {
                segmentErased = true;
                break;
            }
        }
        
        if(!segmentErased) {
            if(currentSegment.length === 0) {
                currentSegment.push(p1);
            }
            currentSegment.push(p2);
        } else {
            if(currentSegment.length >= 2) {
                result.push([...currentSegment]);
            }
            currentSegment = [];
        }
    }
    
    if(currentSegment.length >= 2) {
        result.push(currentSegment);
    }
    
    if(result.length === 0) return [];
    if(result.length === 1) return result[0];
    
    let longest = result[0];
    for(let seg of result) {
        if(seg.length > longest.length) longest = seg;
    }
    return longest;
}

function distanceBetweenSegments(a1, a2, b1, b2) {
    const d1 = distancePointToSegment(a1, b1, b2);
    const d2 = distancePointToSegment(a2, b1, b2);
    const d3 = distancePointToSegment(b1, a1, a2);
    const d4 = distancePointToSegment(b2, a1, a2);
    return Math.min(d1, d2, d3, d4);
}

function distancePointToSegment(point, seg1, seg2) {
    const dx = seg2.x - seg1.x;
    const dy = seg2.y - seg1.y;
    const len = Math.hypot(dx, dy);
    
    if(len === 0) return Math.hypot(point.x - seg1.x, point.y - seg1.y);
    
    const t = ((point.x - seg1.x) * dx + (point.y - seg1.y) * dy) / (len * len);
    
    if(t < 0) return Math.hypot(point.x - seg1.x, point.y - seg1.y);
    if(t > 1) return Math.hypot(point.x - seg2.x, point.y - seg2.y);
    
    const projX = seg1.x + t * dx;
    const projY = seg1.y + t * dy;
    return Math.hypot(point.x - projX, point.y - projY);
}

class DrawingCommand {
    constructor(startState, endState) {
        this.startState = startState;
        this.endState = endState;
    }
    execute() {
        allStrokes = JSON.parse(JSON.stringify(this.endState.allStrokes));
        currentStrokePoints = [];
        redrawAllStrokes();
    }
    undo() {
        allStrokes = JSON.parse(JSON.stringify(this.startState.allStrokes));
        currentStrokePoints = [];
        redrawAllStrokes();
    }
}

class FinishDrawingCommand {
    constructor(drawingState, createdShape) {
        this.drawingState = drawingState;
        this.createdShape = createdShape;
    }
    execute() {
        shapes.push(this.createdShape);
        cancelDrawing();
        rebuildTracks();
        drawAll();
    }
    undo() {
        const index = shapes.indexOf(this.createdShape);
        if(index !== -1) shapes.splice(index, 1);
        allStrokes = JSON.parse(JSON.stringify(this.drawingState));
        currentStrokePoints = [];
        redrawAllStrokes();
        selectShape(null);
        rebuildTracks();
        drawAll();
    }
}

function finishDrawing() {
    if(allStrokes.length === 0) {
        showToast("Draw something first!", 'I');
        return;
    }
    
    const drawingPointsState = JSON.parse(JSON.stringify(allStrokes));
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for(let stroke of allStrokes) {
        for(let point of stroke.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
    }
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    const avgSize = Math.max(width, height, 50);
    
    const shape = new Shape('drawing', centerX, centerY, avgSize);
    shape.strokesData = [];
    
    for(let stroke of allStrokes) {
        const localPoints = stroke.points.map(p => ({
            x: p.x - centerX,
            y: p.y - centerY
        }));
        shape.strokesData.push({
            points: localPoints,
            width: stroke.width,
            color: stroke.color,
            opacity: stroke.opacity,
            brushType: stroke.brushType,
            taperStart: stroke.taperStart,
            taperEnd: stroke.taperEnd
        });
    }
    
    shape.isDrawing = true;
    shape.finished = true;
    shape.editable = false;
    
    clearDrawingCanvas();
    
    if(window.undoManager) {
        const finishCommand = new FinishDrawingCommand(drawingPointsState, shape);
        window.undoManager.execute(finishCommand);
    } else {
        shapes.push(shape);
        cancelDrawing();
        rebuildTracks();
        drawAll();
    }
    allStrokes = [];
    currentStrokePoints = [];
    isDrawing = false;
}

function cancelDrawing() {
    if(allStrokes.length > 0 && window.undoManager && !isDrawing) {
        const cancelCommand = new CancelDrawingCommand(JSON.parse(JSON.stringify(allStrokes)));
        window.undoManager.execute(cancelCommand);
    }
    isDrawing = false;
    allStrokes = [];
    currentStrokePoints = [];
    rawPointsBuffer = [];
    drawingStartState = null;
    if(drawingCtx) {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
    canvas.style.cursor = 'default';
}

class CancelDrawingCommand {
    constructor(drawingState) {
        this.drawingState = drawingState;
    }
    execute() {
        allStrokes = [];
        currentStrokePoints = [];
        redrawAllStrokes();
        drawAll();
    }
    undo() {
        allStrokes = JSON.parse(JSON.stringify(this.drawingState));
        currentStrokePoints = [];
        redrawAllStrokes();
        drawAll();
    }
}

function setBrushTypeFromSelect(value) {
    currentBrushType = value;
    const brushSpacingContainer = document.getElementById('brushSpacingContainer');
    const glowIntensityContainer = document.getElementById('glowIntensityContainer');
    const taperSettingsContainer = document.getElementById('taperSettingsContainer');
    if(brushSpacingContainer) {
        brushSpacingContainer.style.display = (value === 'dotted' || value === 'dashed') ? 'block' : 'none';
    }
    if(glowIntensityContainer) {
        glowIntensityContainer.style.display = value === 'glow' ? 'block' : 'none';
    }
    if(taperSettingsContainer) {
        taperSettingsContainer.style.display = value === 'tapered' ? 'block' : 'none';
    }
}

function setDrawingTool(tool) {
    cancelDrawing();
    if(typeof deactivateSelectionTool === 'function') {
        deactivateSelectionTool();
    }
    if(selectedShape) {
        selectedShape.selected = false;
        selectedShape = null;
    }
    if(selectedShapes && selectedShapes.length > 0) {
        selectedShapes.forEach(s => s.selected = false);
        selectedShapes = [];
    }
    if(shapeManager) shapeManager.setSelectedShape(null);
    if(typeof drawAll === 'function') drawAll();
    currentDrawingTool = tool;
    const brushTypeSelector = document.getElementById('brushTypeSelector');
    document.getElementById('btnPencil').classList.remove('mode-active');
    document.getElementById('btnBrush').classList.remove('mode-active');
    document.getElementById('btnEraser').classList.remove('mode-active');
    
    if(tool === 'pencil') {
        if(brushTypeSelector) brushTypeSelector.style.display = 'none';
        document.getElementById('btnPencil').classList.add('mode-active');
        canvas.style.cursor = 'crosshair';
    } else if(tool === 'brush') {
        if(brushTypeSelector) brushTypeSelector.style.display = 'block';
        document.getElementById('btnBrush').classList.add('mode-active');
        canvas.style.cursor = 'crosshair';
    } else if(tool === 'eraser') {
        if(brushTypeSelector) brushTypeSelector.style.display = 'none';
        document.getElementById('btnEraser').classList.add('mode-active');
        canvas.style.cursor = 'crosshair';
    } else {
        canvas.style.cursor = 'default';
    }
}

function updateStrokeWidth(value) {
    currentStrokeWidth = value;
}

function updateStrokeColor(value) {
    currentStrokeColor = value;
}

function updateStrokeOpacity(value) {
    currentStrokeOpacity = value;
}

function updateStrokeHardness(value) {
    strokeHardness = value;
}

function setMinTaperWidth(value) {
    minTaperWidth = value;
}

function setMaxTaperWidth(value) {
    maxTaperWidth = value;
}

function setBrushSpacing(value) {
    brushSpacing = value;
}

function setGlowIntensity(value) {
    glowIntensity = value;
}

function setStabilizationLevel(value) {
    stabilizationLevel = parseInt(value);
    const stabilizationValue = document.getElementById('stabilizationValue');
    if(stabilizationValue) stabilizationValue.textContent = stabilizationLevel;
}

function setSmoothingAlgorithm(value) {
    currentSmoothing = value;
}

function updateEraserSize(value) {
    eraserStrokeWidth = value;
}

function updateEraserHardness(value) {
    eraserHardness = value;
}

const brushTypeSelect = document.getElementById('brushTypeSelect');
if(brushTypeSelect) {
    brushTypeSelect.addEventListener('change', (e) => setBrushTypeFromSelect(e.target.value));
}

canvas.addEventListener('mousedown', (e) => {
    if(currentDrawingTool === 'eraser') {
        startDrawingStabilized(e);
    } else if(currentDrawingTool === 'pencil' || currentDrawingTool === 'brush') {
        startDrawingStabilized(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if(isDrawing && (currentDrawingTool === 'pencil' || currentDrawingTool === 'brush' || currentDrawingTool === 'eraser')) {
        continueDrawingStabilized(e);
    }
});

canvas.addEventListener('mouseup', () => {
    if(isDrawing) {
        endCurrentStrokeStabilized();
    }
});

canvas.addEventListener('touchstart', (e) => {
    if(currentDrawingTool === 'eraser') {
        e.preventDefault();
        startDrawingStabilized(e);
    } else if(currentDrawingTool === 'pencil' || currentDrawingTool === 'brush') {
        e.preventDefault();
        startDrawingStabilized(e);
    }
});

canvas.addEventListener('touchmove', (e) => {
    if(isDrawing && (currentDrawingTool === 'pencil' || currentDrawingTool === 'brush' || currentDrawingTool === 'eraser')) {
        e.preventDefault();
        continueDrawingStabilized(e);
    }
});

canvas.addEventListener('touchend', () => {
    if(isDrawing) {
        endCurrentStrokeStabilized();
    }
});

const stabilizationSlider = document.getElementById('stabilizationSlider');
if(stabilizationSlider) {
    stabilizationSlider.addEventListener('input', (e) => setStabilizationLevel(e.target.value));
}

const smoothingSelect = document.getElementById('smoothingSelect');
if(smoothingSelect) {
    smoothingSelect.addEventListener('change', (e) => setSmoothingAlgorithm(e.target.value));
}
