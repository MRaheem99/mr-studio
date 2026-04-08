let previewCircle = null;

function setFillBucketTool(active) {
    fillBucketTool = active;
    if(active) {
        if(currentDrawingTool) {
            setDrawingTool(null);
        }
        canvas.style.cursor = 'crosshair';
        const btnFillBucket = document.getElementById('btnFillBucket');
        if(btnFillBucket) btnFillBucket.classList.add('mode-active');
    } else {
        canvas.style.cursor = 'default';
        const btnFillBucket = document.getElementById('btnFillBucket');
        if(btnFillBucket) btnFillBucket.classList.remove('mode-active');
    }
}

function isPointInPolygon(point, vertices) {
    let inside = false;
    for(let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;
        const intersect = ((yi > point.y) != (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if(intersect) inside = !inside;
    }
    return inside;
}

function isStrokeClosed(shape, strokePoints) {
    if(!strokePoints || strokePoints.length < 3) return false;
    const firstWorld = shape.localToWorld(strokePoints[0].x, strokePoints[0].y);
    const lastWorld = shape.localToWorld(strokePoints[strokePoints.length - 1].x, strokePoints[strokePoints.length - 1].y);
    const distance = Math.hypot(firstWorld.x - lastWorld.x, firstWorld.y - lastWorld.y);
    const bounds = shape.getBounds();
    const shapeSize = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    const threshold = Math.max(15, shapeSize * 0.05); // 5% of shape size or minimum 15
    return distance < threshold;
}

function isShapeClosed(shape) {
    if(shape.type === 'drawing' && shape.strokesData) {
        for(let stroke of shape.strokesData) {
            if(isStrokeClosed(shape, stroke.points)) {
                return true;
            }
        }
        return false;
    } else if(shape.type === 'polyline' || shape.type === 'path') {
        if(shape.points && shape.points.length >= 3) {
            const first = shape.points[0];
            const last = shape.points[shape.points.length - 1];
            const firstWorld = shape.localToWorld(first.x, first.y);
            const lastWorld = shape.localToWorld(last.x, last.y);
            return Math.hypot(firstWorld.x - lastWorld.x, firstWorld.y - lastWorld.y) < 10;
        }
        return false;
    } else if(shape.type === 'circle') {
        return true;
    } else if(shape.type === 'square' || shape.type === 'triangle' || shape.type === 'pentagon' ||
        shape.type === 'star' || shape.type === 'arrow' || shape.type === 'polygon') {
        return true;
    }
    return false;
}

function fillShape(shape, color) {
    if(!shape) return false;
    const oldColor = shape.color;
    shape.color = color;
    
    if(window.undoManager) {
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
    if(btnFillBucket) {
        btnFillBucket.addEventListener('click', () => {
            if(fillBucketTool) {
                setFillBucketTool(false);
            } else {
                setFillBucketTool(true);
            }
        });
    }
    const fillColorPicker = document.getElementById('fillColorPicker');
    if(fillColorPicker) {
        fillColorPicker.addEventListener('change', (e) => {
            updateFillColor(e.target.value);
        });
    }
}

function fillAtPosition(e) {
    if(!fillBucketTool) return false;
    
    const pos = getCanvasMousePosition(e);
    let clickedShape = null;
    
    console.log("Click position:", pos);
    
    for(let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        
        if(shape.type === 'drawing' && shape.strokesData) {
            console.log("Checking drawing shape:", shape);
            console.log("Strokes data length:", shape.strokesData.length);
            
            for(let s = 0; s < shape.strokesData.length; s++) {
                const stroke = shape.strokesData[s];
                const points = stroke.points;
                console.log(`Stroke ${s} points count:`, points.length);
                
                if(points.length >= 3) {
                    const firstWorld = shape.localToWorld(points[0].x, points[0].y);
                    const lastWorld = shape.localToWorld(points[points.length - 1].x, points[points.length - 1].y);
                    const distance = Math.hypot(firstWorld.x - lastWorld.x, firstWorld.y - lastWorld.y);
                    console.log(`Stroke ${s} first-last distance:`, distance);
                    
                    if(distance < 15) {
                        console.log(`Stroke ${s} is CLOSED!`);
                        const worldPoints = points.map(p => shape.localToWorld(p.x, p.y));
                        const isInside = isPointInPolygon(pos, worldPoints);
                        console.log(`Point inside polygon:`, isInside);
                        
                        if(isInside) {
                            clickedShape = shape;
                            break;
                        }
                    } else {
                        console.log(`Stroke ${s} is NOT closed (distance: ${distance})`);
                    }
                }
            }
            if(clickedShape) break;
        } 
        
        else if(shape.isPointInside && shape.isPointInside(pos.x, pos.y)) {
            console.log("Regular shape clicked:", shape.type);
            if((shape.type === 'polyline' || shape.type === 'path') && !isShapeClosed(shape)) {
                console.log("Shape not closed, skipping");
                continue;
            }
            clickedShape = shape;
            break;
        }
    }
    
    if(clickedShape) {
        console.log("Shape found, filling...");
        if(clickedShape.type === 'drawing') {
            fillDrawingShape(clickedShape, fillColor, pos);
        } else {
            fillShape(clickedShape, fillColor);
        }
        drawAll();
        showToast(`Filled with ${fillColor}`, 'S');
        return true;
    } else {
        console.log("No closed shape found");
        showToast("No closed shape found", 'I');
        return false;
    }
}

function fillDrawingShape(shape, color, clickPoint) {
    console.log("fillDrawingShape called");
    if(!shape.strokesData || shape.strokesData.length === 0) {
        console.log("No strokesData");
        return false;
    }
    
    let filled = false;
    if(!shape.strokeFillColors) {
        shape.strokeFillColors = [];
    }
    
    for(let i = 0; i < shape.strokesData.length; i++) {
        const stroke = shape.strokesData[i];
        const points = stroke.points;
        
        if(points.length >= 3) {
            const firstWorld = shape.localToWorld(points[0].x, points[0].y);
            const lastWorld = shape.localToWorld(points[points.length - 1].x, points[points.length - 1].y);
            const distance = Math.hypot(firstWorld.x - lastWorld.x, firstWorld.y - lastWorld.y);
            
            console.log(`Stroke ${i} distance:`, distance);
            
            if(distance < 15) {
                const worldPoints = points.map(p => shape.localToWorld(p.x, p.y));
                if(isPointInPolygon(clickPoint, worldPoints)) {
                    shape.strokeFillColors[i] = color;
                    filled = true;
                    console.log(`Filled stroke ${i}`);
                }
            }
        }
    }
    
    if(filled && window.undoManager) {
        const fillCommand = {
            execute: () => {
                drawAll();
            },
            undo: () => {
                shape.strokeFillColors = [];
                drawAll();
            }
        };
        window.undoManager.execute(fillCommand);
    }
    
    console.log("Fill result:", filled);
    return filled;
}

function showFillPreview(e) {
    if(!fillBucketTool) return;
    const pos = getCanvasMousePosition(e);
    const rect = canvas.getBoundingClientRect();
    if(!previewCircle) {
        previewCircle = document.createElement('div');
        previewCircle.style.position = 'fixed';
        previewCircle.style.width = '20px';
        previewCircle.style.height = '20px';
        previewCircle.style.borderRadius = '50%';
        previewCircle.style.border = '2px solid white';
        previewCircle.style.pointerEvents = 'none';
        previewCircle.style.zIndex = '1000';
        document.body.appendChild(previewCircle);
    }
    previewCircle.style.left = (rect.left + (pos.x / canvas.width) * rect.width - 10) + 'px';
    previewCircle.style.top = (rect.top + (pos.y / canvas.height) * rect.height - 10) + 'px';
    previewCircle.style.backgroundColor = fillColor;
    previewCircle.style.display = 'block';
}

function hideFillPreview() {
    if(previewCircle) {
        previewCircle.style.display = 'none';
    }
}

canvas.addEventListener('click', (e) => {
    if(fillBucketTool) {
        e.preventDefault();
        fillAtPosition(e);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if(fillBucketTool) {
        showFillPreview(e);
    } else if(previewCircle) {
        hideFillPreview();
    }
});

canvas.addEventListener('mouseleave', () => {
    hideFillPreview();
});
