class Group {
    constructor(name) {
        this.type = "group";
        this.name = name;
        this.children = [];
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.skewX = 0;
        this.skewY = 0;
        this.pivotX = 0;
        this.pivotY = 0;
        this.opacity = 1;
        this.selected = false;
        this.keyframes = [];
        this.track = null;
        this.expanded = true;
        this.size = 100;
        this.color = null;
        this.borderColor = null;
        this.borderWidth = 0;
    }
    getLocalBounds() {
        if(this.children.length === 0) {
            return {
                minX: -60,
                maxX: 60,
                minY: -60,
                maxY: 60
            };
        }
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        
        this.children.forEach(child => {
            let childMinX, childMaxX, childMinY, childMaxY;
            
            if(child.type === "group") {
                const childBounds = child.getLocalBounds();
                childMinX = childBounds.minX;
                childMaxX = childBounds.maxX;
                childMinY = childBounds.minY;
                childMaxY = childBounds.maxY;
            } 
            else if(child.type === "drawing" && child.strokesData) {
                // For drawing shapes, calculate bounds from strokesData points
                let drawingMinX = Infinity, drawingMaxX = -Infinity, 
                    drawingMinY = Infinity, drawingMaxY = -Infinity;
                
                for(let stroke of child.strokesData) {
                    for(let point of stroke.points) {
                        drawingMinX = Math.min(drawingMinX, point.x);
                        drawingMaxX = Math.max(drawingMaxX, point.x);
                        drawingMinY = Math.min(drawingMinY, point.y);
                        drawingMaxY = Math.max(drawingMaxY, point.y);
                    }
                }
                
                // If no points found, use default size
                if(drawingMinX === Infinity) {
                    childMinX = child.x - 50;
                    childMaxX = child.x + 50;
                    childMinY = child.y - 50;
                    childMaxY = child.y + 50;
                } else {
                    childMinX = drawingMinX;
                    childMaxX = drawingMaxX;
                    childMinY = drawingMinY;
                    childMaxY = drawingMaxY;
                }
            }
            else {
                // For regular shapes
                const halfSize = child.size / 2;
                childMinX = child.x - halfSize;
                childMaxX = child.x + halfSize;
                childMinY = child.y - halfSize;
                childMaxY = child.y + halfSize;
            }
            
            minX = Math.min(minX, childMinX);
            maxX = Math.max(maxX, childMaxX);
            minY = Math.min(minY, childMinY);
            maxY = Math.max(maxY, childMaxY);
        });
        
        return {
            minX,
            maxX,
            minY,
            maxY
        };
    }
    getBounds() {
        if (this.children.length === 0) {
            return { minX: this.x - 50, maxX: this.x + 50, minY: this.y - 50, maxY: this.y + 50 };
        }
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        this.children.forEach(child => {
            let childBounds;
            
            if (child.type === "group") {
                childBounds = child.getBounds();
            } 
            else if (child.type === "drawing" && child.strokesData) {
                // For drawing shapes, calculate bounds from strokesData in world coordinates
                let drawingMinX = Infinity, drawingMaxX = -Infinity, 
                    drawingMinY = Infinity, drawingMaxY = -Infinity;
                
                for (let stroke of child.strokesData) {
                    for (let point of stroke.points) {
                        const worldPoint = child.localToWorld(point.x, point.y);
                        drawingMinX = Math.min(drawingMinX, worldPoint.x);
                        drawingMaxX = Math.max(drawingMaxX, worldPoint.x);
                        drawingMinY = Math.min(drawingMinY, worldPoint.y);
                        drawingMaxY = Math.max(drawingMaxY, worldPoint.y);
                    }
                }
                
                childBounds = { 
                    minX: drawingMinX, 
                    maxX: drawingMaxX, 
                    minY: drawingMinY, 
                    maxY: drawingMaxY 
                };
            } 
            else {
                // For regular shapes
                const halfSize = child.size / 2;
                const corners = [
                    child.localToWorld(-halfSize, -halfSize),
                    child.localToWorld(halfSize, -halfSize),
                    child.localToWorld(-halfSize, halfSize),
                    child.localToWorld(halfSize, halfSize)
                ];
                childBounds = {
                    minX: Math.min(...corners.map(c => c.x)),
                    maxX: Math.max(...corners.map(c => c.x)),
                    minY: Math.min(...corners.map(c => c.y)),
                    maxY: Math.max(...corners.map(c => c.y))
                };
            }
            
            minX = Math.min(minX, childBounds.minX);
            maxX = Math.max(maxX, childBounds.maxX);
            minY = Math.min(minY, childBounds.minY);
            maxY = Math.max(maxY, childBounds.maxY);
        });
        
        return { minX, maxX, minY, maxY };
    }
    localToWorld(lx, ly) {
        const tanX = Math.tan(this.skewX);
        const tanY = Math.tan(this.skewY);
        const sx = lx + tanX * ly;
        const sy = ly + tanY * lx;
        const scx = sx * this.scaleX;
        const scy = sy * this.scaleY;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rx = scx * cos - scy * sin;
        const ry = scx * sin + scy * cos;
        return {
            x: this.x + rx,
            y: this.y + ry
        };
    }
    worldToLocal(wx, wy) {
        let dx = wx - this.x;
        let dy = wy - this.y;
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        let rx = dx * cos - dy * sin;
        let ry = dx * sin + dy * cos;
        const sx = rx / (this.scaleX || 1);
        const sy = ry / (this.scaleY || 1);
        const tanX = Math.tan(this.skewX);
        const tanY = Math.tan(this.skewY);
        const denom = 1 - tanX * tanY;
        if(Math.abs(denom) < 0.001) {
            return {
                x: sx,
                y: sy
            };
        }
        return {
            x: (sx - tanX * sy) / denom,
            y: (sy - tanY * sx) / denom
        };
    }
    getPivotWorldPosition() {
        const scaledPivotX = this.pivotX * this.scaleX;
        const scaledPivotY = this.pivotY * this.scaleY;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return {
            x: this.x + (scaledPivotX * cos - scaledPivotY * sin),
            y: this.y + (scaledPivotX * sin + scaledPivotY * cos)
        };
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.transform(
            this.scaleX,
            Math.tan(this.skewY),
            Math.tan(this.skewX),
            this.scaleY,
            0,
            0
        );
        ctx.globalAlpha = this.opacity;
        this.children.forEach(child => {
            child.draw(ctx);
        });
        ctx.restore();
        if(!isDrawing && this.selected && viewport.mode === 'object') {
            this.drawHandles(ctx);
            this.drawPivotHandle(ctx);
        }
    }
    drawHandles(ctx) {
        if(this.parentGroup) {
            return;
        }
        if(isDrawing) return;
        const bounds = this.getLocalBounds();
        const padding = 25;
        const halfW = Math.max((bounds.maxX - bounds.minX) / 2, 60) + padding;
        const halfH = Math.max((bounds.maxY - bounds.minY) / 2, 60) + padding;
        const handleSize = 10 / (viewport?.scale || 1);
        const toWorld = (lx, ly) => this.localToWorld(lx, ly);
        ctx.save();
        ctx.shadowColor = "rgba(0,212,255,0.35)";
        ctx.shadowBlur = 10 / (viewport?.scale || 1);
        ctx.strokeStyle = "#00d4ff";
        ctx.fillStyle = "rgba(0, 212, 255, 0.05)";
        ctx.lineWidth = 2 / (viewport?.scale || 1);
        ctx.setLineDash([6 / (viewport?.scale || 1), 4 / (viewport?.scale || 1)]);
        const corners = [{
                x: -halfW,
                y: -halfH
            },
            {
                x: halfW,
                y: -halfH
            },
            {
                x: halfW,
                y: halfH
            },
            {
                x: -halfW,
                y: halfH
            }
        ];
        ctx.beginPath();
        const p1 = toWorld(corners[0].x, corners[0].y);
        ctx.moveTo(p1.x, p1.y);
        for(let i = 1; i < corners.length; i++) {
            const p = toWorld(corners[i].x, corners[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#00d4ff";
        corners.forEach(pos => {
            const world = toWorld(pos.x, pos.y);
            ctx.beginPath();
            ctx.rect(world.x - handleSize, world.y - handleSize, handleSize * 2, handleSize * 2);
            ctx.fill();
            ctx.stroke();
        });
        const edges = [{
                x: 0,
                y: -halfH
            },
            {
                x: 0,
                y: halfH
            },
            {
                x: -halfW,
                y: 0
            },
            {
                x: halfW,
                y: 0
            }
        ];
        ctx.fillStyle = "#ff9f43";
        edges.forEach(pos => {
            const world = toWorld(pos.x, pos.y);
            ctx.beginPath();
            ctx.arc(world.x, world.y, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        const skewOffset = 35 / (viewport?.scale || 1);
        const skewHandles = [{
                x: 0,
                y: -halfH - skewOffset
            },
            {
                x: 0,
                y: halfH + skewOffset
            },
            {
                x: -halfW - skewOffset,
                y: 0
            },
            {
                x: halfW + skewOffset,
                y: 0
            }
        ];
        ctx.fillStyle = "#ff5ec4";
        skewHandles.forEach(pos => {
            const world = toWorld(pos.x, pos.y);
            ctx.save();
            ctx.translate(world.x, world.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.moveTo(0, -handleSize);
            ctx.lineTo(handleSize, 0);
            ctx.lineTo(0, handleSize);
            ctx.lineTo(-handleSize, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
        const rotLocalY = -halfH - 50 / (viewport?.scale || 1);
        const rotWorld = toWorld(0, rotLocalY);
        const topWorld = toWorld(0, -halfH);
        ctx.strokeStyle = "#00d4ff";
        ctx.beginPath();
        ctx.moveTo(topWorld.x, topWorld.y);
        ctx.lineTo(rotWorld.x, rotWorld.y);
        ctx.stroke();
        ctx.fillStyle = "#00d4ff";
        ctx.beginPath();
        ctx.arc(rotWorld.x, rotWorld.y, handleSize + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();
    }
    drawPivotHandle(ctx) {
        if(this.parentGroup) {
            return;
        }
        const pivot = this.getPivotWorldPosition();
        const handleSize = 10 / (viewport?.scale || 1);
        const cross = 8 / (viewport?.scale || 1);
        ctx.save();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--mode-canvas').trim() || '#ff9f43';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / (viewport?.scale || 1);
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pivot.x - cross, pivot.y);
        ctx.lineTo(pivot.x + cross, pivot.y);
        ctx.moveTo(pivot.x, pivot.y - cross);
        ctx.lineTo(pivot.x, pivot.y + cross);
        ctx.stroke();
        ctx.restore();
    }
    isPointInside(px, py) {
        const local = this.worldToLocal(px, py);
        const bounds = this.getLocalBounds();
        const padding = 20;
        const halfW = Math.max((bounds.maxX - bounds.minX) / 2, 60) + padding;
        const halfH = Math.max((bounds.maxY - bounds.minY) / 2, 60) + padding;
        return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
    }
    getHandleAt(px, py) {
        if(this.parentGroup) return null;
        if(isDrawing) return null;
        if(!this.selected) return null;
        const hitR = 20 / (viewport?.scale || 1);
        const bounds = this.getLocalBounds();
        const padding = 25;
        const halfW = Math.max((bounds.maxX - bounds.minX) / 2, 60) + padding;
        const halfH = Math.max((bounds.maxY - bounds.minY) / 2, 60) + padding;
        const toWorld = (lx, ly) => this.localToWorld(lx, ly);
        const rotLocalY = -halfH - 50 / (viewport?.scale || 1);
        const rotWorld = toWorld(0, rotLocalY);
        if(Math.hypot(px - rotWorld.x, py - rotWorld.y) < hitR) return 'rotate';
        const corners = [{
                x: -halfW,
                y: -halfH
            },
            {
                x: halfW,
                y: -halfH
            },
            {
                x: -halfW,
                y: halfH
            },
            {
                x: halfW,
                y: halfH
            }
        ];
        for(const c of corners) {
            const w = toWorld(c.x, c.y);
            if(Math.hypot(px - w.x, py - w.y) < hitR) return 'scale';
        }
        const edges = [{
                x: 0,
                y: -halfH,
                id: 'stretch-y-top'
            },
            {
                x: 0,
                y: halfH,
                id: 'stretch-y-bottom'
            },
            {
                x: -halfW,
                y: 0,
                id: 'stretch-x-left'
            },
            {
                x: halfW,
                y: 0,
                id: 'stretch-x-right'
            }
        ];
        for(const e of edges) {
            const w = toWorld(e.x, e.y);
            if(Math.hypot(px - w.x, py - w.y) < hitR) return e.id;
        }
        const skewOffset = 35 / (viewport?.scale || 1);
        const skewHandles = [{
                x: 0,
                y: -halfH - skewOffset,
                id: 'skewY'
            },
            {
                x: 0,
                y: halfH + skewOffset,
                id: 'skewY'
            },
            {
                x: -halfW - skewOffset,
                y: 0,
                id: 'skewX'
            },
            {
                x: halfW + skewOffset,
                y: 0,
                id: 'skewX'
            }
        ];
        for(const s of skewHandles) {
            const w = toWorld(s.x, s.y);
            if(Math.hypot(px - w.x, py - w.y) < hitR) return s.id;
        }
        const pivot = this.getPivotWorldPosition();
        if(Math.hypot(px - pivot.x, py - pivot.y) < hitR) return 'pivot';
        const local = this.worldToLocal(px, py);
        if(Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH) {
            return 'drag';
        }
        return null;
    }
    addChild(child) {
        const index = shapes.indexOf(child);
        if(index !== -1) shapes.splice(index, 1);
        this.children.push(child);
        child.parentGroup = this;
    }
    ungroup() {
        const index = shapes.indexOf(this);
        if(index !== -1) shapes.splice(index, 1);
        this.children.forEach(child => {
            child.x = child.x + this.x;
            child.y = child.y + this.y;
            child.parentGroup = null;
            shapes.push(child);
        });
        return this.children;
    }
    setOpacity(value) {
        this.opacity = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setOpacity(value);
            } else {
                child.opacity = value;
            }
        });
    }
    setBorderWidth(value) {
        this.borderWidth = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setBorderWidth(value);
            } else {
                child.borderWidth = value;
            }
        });
    }
    setBorderColor(value) {
        this.borderColor = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setBorderColor(value);
            } else {
                child.borderColor = value;
            }
        });
    }
    setBorderOffset(value) {
        this.borderOffset = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setBorderOffset(value);
            } else {
                child.borderOffset = value;
            }
        });
    }
    setBorderBlur(value) {
        this.borderBlur = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setBorderBlur(value);
            } else {
                child.borderBlur = value;
            }
        });
    }
    setShadowColor(value) {
        this.shadowColor = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setShadowColor(value);
            } else {
                child.shadowColor = value;
            }
        });
    }
    setShadowBlur(value) {
        this.shadowBlur = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setShadowBlur(value);
            } else {
                child.shadowBlur = value;
            }
        });
    }
    setShadowOffsetX(value) {
        this.shadowOffsetX = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setShadowOffsetX(value);
            } else {
                child.shadowOffsetX = value;
            }
        });
    }
    setShadowOffsetY(value) {
        this.shadowOffsetY = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setShadowOffsetY(value);
            } else {
                child.shadowOffsetY = value;
            }
        });
    }
    setShadowOpacity(value) {
        this.shadowOpacity = value;
        this.children.forEach(child => {
            if(child.type === "group") {
                child.setShadowOpacity(value);
            } else {
                child.shadowOpacity = value;
            }
        });
    }
}