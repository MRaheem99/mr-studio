let previewCircle = null;
let hoveredShape = null;
let hoveredStrokeIndex = -1;

function clearHoverPreview() {
    if (hoveredShape) {
        if (hoveredShape._tempFillColors) {
            hoveredShape._tempFillColors[hoveredStrokeIndex] = null;
        }
        drawAll();
        hoveredShape = null;
        hoveredStrokeIndex = -1;
    }
}

function showHoverPreview(shape, strokeIndex) {
    clearHoverPreview();
    if (!shape._tempFillColors) {
        shape._tempFillColors = [];
    }
    const r = parseInt(fillColor.slice(1, 3), 16);
    const g = parseInt(fillColor.slice(3, 5), 16);
    const b = parseInt(fillColor.slice(5, 7), 16);
    shape._tempFillColors[strokeIndex] = `rgba(${r}, ${g}, ${b}, 0.3)`;
    hoveredShape = shape;
    hoveredStrokeIndex = strokeIndex;
    drawAll();
}
canvas.addEventListener('mousemove', (e) => {
    if (fillBucketTool) {
        showFillPreview(e);
    } else {
        if (window._previewShape) {
            if (window._previewShape._tempFillColors) {
                window._previewShape._tempFillColors[window._previewStrokeIndex] = null;
            }
            drawAll();
            window._previewShape = null;
        }
        if (previewCircle) {
            previewCircle.style.display = 'none';
        }
    }
});
canvas.addEventListener('mouseleave', () => {
    clearHoverPreview();
    hideFillPreview();
});

function isStrokeClosedLocal(points) {
    if (!points || points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    const distance = Math.hypot(first.x - last.x, first.y - last.y);
    return distance < 15;
}

function setFillBucketTool(active) {
    fillBucketTool = active;
    if (active) {
        if (currentDrawingTool) {
            setDrawingTool(null);
        }
        canvas.style.cursor = 'crosshair';
        const btnFillBucket = document.getElementById('btnFillBucket');
        if (btnFillBucket) btnFillBucket.classList.add('mode-active');
    } else {
        canvas.style.cursor = 'default';
        const btnFillBucket = document.getElementById('btnFillBucket');
        if (btnFillBucket) btnFillBucket.classList.remove('mode-active');
    }
}

function isPointInPolygon(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x,
            yi = vertices[i].y;
        const xj = vertices[j].x,
            yj = vertices[j].y;
        const intersect = ((yi > point.y) != (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function isStrokeClosed(shape, strokePoints) {
    return true;
}

function fillAtPosition(e) {
    if (!fillBucketTool) return false;
    
    e.stopPropagation();
    
    const pos = getCanvasMousePosition(e);
    let clickedShape = null;
    
    console.log("Click position:", pos);
    
    for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        
        if (shape.type === 'drawing' && shape.strokesData) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (let stroke of shape.strokesData) {
                for (let point of stroke.points) {
                    const wp = shape.localToWorld(point.x, point.y);
                    minX = Math.min(minX, wp.x);
                    maxX = Math.max(maxX, wp.x);
                    minY = Math.min(minY, wp.y);
                    maxY = Math.max(maxY, wp.y);
                }
            }
            
            const padding = 10;
            if (pos.x >= minX - padding && pos.x <= maxX + padding && 
                pos.y >= minY - padding && pos.y <= maxY + padding) {
                clickedShape = shape;
                break;
            }
        } 
        else if (shape.isPointInside && shape.isPointInside(pos.x, pos.y)) {
            console.log("Regular shape clicked:", shape.type);
            if ((shape.type === 'polyline' || shape.type === 'path') && !isShapeClosed(shape)) {
                continue;
            }
            clickedShape = shape;
            break;
        }
    }
    
    if (clickedShape) {
        if (clickedShape.type === 'drawing') {
            fillDrawingShape(clickedShape, fillColor, pos);
        } else {
            fillShape(clickedShape, fillColor);
        }
        drawAll();
        
        return true;
    } else {
        return false;
    }
}

function showFillPreview(e) {
    if (!fillBucketTool) return;
    
    e.stopPropagation();
    
    const pos = getCanvasMousePosition(e);
    const rect = canvas.getBoundingClientRect();
    
    if (window._previewShape) {
        if (window._previewShape._tempFillColors) {
            window._previewShape._tempFillColors = [];
        }
        drawAll();
        window._previewShape = null;
    }
    
    for (let shape of shapes) {
        if (shape.type === 'drawing' && shape.strokesData) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (let stroke of shape.strokesData) {
                for (let point of stroke.points) {
                    const wp = shape.localToWorld(point.x, point.y);
                    minX = Math.min(minX, wp.x);
                    maxX = Math.max(maxX, wp.x);
                    minY = Math.min(minY, wp.y);
                    maxY = Math.max(maxY, wp.y);
                }
            }
            
            const padding = 10;
            if (pos.x >= minX - padding && pos.x <= maxX + padding && 
                pos.y >= minY - padding && pos.y <= maxY + padding) {
                
                if (!shape._tempFillColors) {
                    shape._tempFillColors = [];
                }
                const r = parseInt(fillColor.slice(1, 3), 16);
                const g = parseInt(fillColor.slice(3, 5), 16);
                const b = parseInt(fillColor.slice(5, 7), 16);
                
                for (let i = 0; i < shape.strokesData.length; i++) {
                    shape._tempFillColors[i] = `rgba(${r}, ${g}, ${b}, 0.35)`;
                }
                window._previewShape = shape;
                drawAll();
                break;
            }
        }
    }
    
    if (!previewCircle) {
        previewCircle = document.createElement('div');
        previewCircle.style.position = 'fixed';
        previewCircle.style.width = '18px';
        previewCircle.style.height = '18px';
        previewCircle.style.borderRadius = '50%';
        previewCircle.style.border = '1px solid white';
        previewCircle.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
        previewCircle.style.pointerEvents = 'none';
        previewCircle.style.zIndex = '1000';
        document.body.appendChild(previewCircle);
    }
    previewCircle.style.left = (rect.left + (pos.x / canvas.width) * rect.width - 9) + 'px';
    previewCircle.style.top = (rect.top + (pos.y / canvas.height) * rect.height - 9) + 'px';
    previewCircle.style.backgroundColor = fillColor;
    previewCircle.style.display = 'block';
}

function isShapeClosed(shape) {
    if (shape.type === 'drawing' && shape.strokesData) {
        for (let stroke of shape.strokesData) {
            if (isStrokeClosed()) {
                return true;
            }
        }
        return false;
    } else if (shape.type === 'polyline' || shape.type === 'path') {
        if (shape.points && shape.points.length >= 3) {
            const first = shape.points[0];
            const last = shape.points[shape.points.length - 1];
            const firstWorld = shape.localToWorld(first.x, first.y);
            const lastWorld = shape.localToWorld(last.x, last.y);
            return Math.hypot(firstWorld.x - lastWorld.x, firstWorld.y - lastWorld.y) < 10;
        }
        return false;
    } else if (shape.type === 'circle') {
        return true;
    } else if (shape.type === 'square' || shape.type === 'triangle' || shape.type === 'pentagon' ||
        shape.type === 'star' || shape.type === 'arrow' || shape.type === 'polygon') {
        return true;
    }
    return false;
}

function fillShape(shape, color) {
    if (!shape) return false;
    const oldColor = shape.color;
    shape.color = color;
    if (window.undoManager) {
        const fillCommand = {
            execute: () => {
                shape.color = color;
                drawAll();
            },
            undo: () => {
                shape.color = oldColor;
                drawAll();
            }
        };
        window.undoManager.execute(fillCommand);
    }
    drawAll();
    return true;
}

function updateFillColor(value) {
    fillColor = value;
}

function initFillBucketTool() {
    const btnFillBucket = document.getElementById('btnFillBucket');
    if (btnFillBucket) {
        btnFillBucket.addEventListener('click', () => {
            if (fillBucketTool) {
                setFillBucketTool(false);
            } else {
                setFillBucketTool(true);
            }
        });
    }
    const fillColorPicker = document.getElementById('fillColorPicker');
    if (fillColorPicker) {
        fillColorPicker.addEventListener('change', (e) => {
            updateFillColor(e.target.value);
        });
    }
}

function fillDrawingShape(shape, color, clickPoint) {
    console.log("fillDrawingShape called");
    if (!shape.strokesData || shape.strokesData.length === 0) {
        console.log("No strokesData");
        return false;
    }
    
    let filled = false;
    const oldFillColors = shape.strokeFillColors ? [...shape.strokeFillColors] : [];
    
    if (!shape.strokeFillColors) {
        shape.strokeFillColors = [];
    }
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let stroke of shape.strokesData) {
        for (let point of stroke.points) {
            const wp = shape.localToWorld(point.x, point.y);
            minX = Math.min(minX, wp.x);
            maxX = Math.max(maxX, wp.x);
            minY = Math.min(minY, wp.y);
            maxY = Math.max(maxY, wp.y);
        }
    }
    
    if (clickPoint.x >= minX && clickPoint.x <= maxX && clickPoint.y >= minY && clickPoint.y <= maxY) {
        for (let i = 0; i < shape.strokesData.length; i++) {
            shape.strokeFillColors[i] = color;
            filled = true;
        }
    }
    
    if (filled) {
        drawAll();
        if (window.undoManager) {
            const fillCommand = {
                execute: () => {
                    for (let i = 0; i < shape.strokesData.length; i++) {
                        shape.strokeFillColors[i] = color;
                    }
                    drawAll();
                },
                undo: () => {
                    shape.strokeFillColors = oldFillColors;
                    drawAll();
                }
            };
            window.undoManager.execute(fillCommand);
        }
    }
    
    console.log("Fill result:", filled);
    return filled;
}

function isPointInPolygonWithNesting(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x,
            yi = vertices[i].y;
        const xj = vertices[j].x,
            yj = vertices[j].y;
        const intersect = ((yi > point.y) != (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function hideFillPreview() {
    if (previewCircle) {
        previewCircle.style.display = 'none';
    }
}

canvas.addEventListener('mousemove', (e) => {
    if (fillBucketTool) {
        e.stopPropagation();
        showFillPreview(e);
    } else {
        hideFillPreview();
    }
});

canvas.addEventListener('mouseleave', () => {
    hideFillPreview();
});

canvas.addEventListener('click', (e) => {
    if (fillBucketTool) {
        e.preventDefault();
        e.stopPropagation();
        fillAtPosition(e);
    }
});
