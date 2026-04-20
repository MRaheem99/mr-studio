class Shape {
    constructor(type, x, y, size) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.isDrawing = false;
        this.segments = [];
        this.segmentColors = [];
        this.segmentWidths = [];
        this.segmentOpacities = [];
        this.segmentBrushTypes = [];
        this.segmentTaperStarts = [];
        this.segmentTaperEnds = [];
        this.rotation = 0;
        this.color = getRandomColor();
        this.bgImage = null;
        this.bgImageObj = null;
        this.bgFit = "cover";
        this.bgOffsetX = 0;
        this.bgOffsetY = 0;
        this.bgScale = 1;
        this.opacity = 1;
        this.borderWidth = 0;
        this.borderColor = '#ffffff';
        this.borderOffset = 0;
        this.borderBlur = 0;
        this.cornerRadius = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.skewX = 0;
        this.skewY = 0;
        this.shadowColor = '#000000';
        this.shadowBlur = 0;
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        this.shadowOpacity = 0.5;
        this.selected = false;
        this.keyframes = [];
        this.track = null;
        this._kfIndex = 0;
        this._lastTime = -1;
        this.text = "Hello";
        this.fontSize = 40;
        this.fontFamily = "Arial";
        this.imageObj = null;
        this.filterBrightness = 100;
        this.filterContrast = 100;
        this.filterSaturation = 100;
        this.filterBlur = 0;
        this.pivotX = 0;
        this.pivotY = 0;
        this.sides = 5;
        this.parentGroup = null;
        this.finished = true;
        this.editable = false;
        this.points = [];
        this.locked = false;
        this.visible = true;
        this.id = Date.now() + Math.random();
        this.filterBrightness = 100;
        this.filterContrast = 100;
        this.filterSaturation = 100;
        this.filterBlur = 0;
        this.filterGrayscale = 0;
        this.filterSepia = 0;
        this.filterHueRotate = 0;
        this.filterInvert = 0;
        if (type === "polyline") {
            this.points = [{
                x: -50,
                y: 0
            }, {
                x: 0,
                y: -50
            }, {
                x: 50,
                y: 0
            }];
        }
        if (type === "path") {
            this.points = [{
                x: 0,
                y: 0,
                in: {
                    x: 0,
                    y: 0
                },
                out: {
                    x: 0,
                    y: 0
                },
                curve: false
            }];
        }
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.moveTo(x + r, y);
                this.lineTo(x + w - r, y);
                this.quadraticCurveTo(x + w, y, x + w, y + r);
                this.lineTo(x + w, y + h - r);
                this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                this.lineTo(x + r, y + h);
                this.quadraticCurveTo(x, y + h, x, y + h - r);
                this.lineTo(x, y + r);
                this.quadraticCurveTo(x, y, x + r, y);
                return this;
            };
        }
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
        const scaleX = this.scaleX || 1;
        const scaleY = this.scaleY || 1;
        const sx = rx / scaleX;
        const sy = ry / scaleY;
        const tanX = Math.tan(this.skewX);
        const tanY = Math.tan(this.skewY);
        const denom = 1 - tanX * tanY;
        if (Math.abs(denom) < 0.001) return {
            x: sx,
            y: sy
        };
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
            x: this.x + scaledPivotX * cos - scaledPivotY * sin,
            y: this.y + scaledPivotX * sin + scaledPivotY * cos
        };
    }
    getGeometryBounds() {
        if (!(this.type === "polyline" || this.type === "path") || !this.points || this.points.length === 0) {
            const half = this.size / 2;
            return {
                minX: -half,
                maxX: half,
                minY: -half,
                maxY: half
            };
        }
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
            if (this.type === "path" && p.curve) {
                minX = Math.min(minX, p.x + p.in.x, p.x + p.out.x);
                maxX = Math.max(maxX, p.x + p.in.x, p.x + p.out.x);
                minY = Math.min(minY, p.y + p.in.y, p.y + p.out.y);
                maxY = Math.max(maxY, p.y + p.in.y, p.y + p.out.y);
            }
        });
        return {
            minX,
            maxX,
            minY,
            maxY
        };
    }
    getGeometryCenter() {
        const b = this.getGeometryBounds();
        return {
            x: (b.minX + b.maxX) / 2,
            y: (b.minY + b.maxY) / 2
        };
    }
    centerGeometry() {
        if (!this.points || this.points.length === 0) return;
        const center = this.getGeometryCenter();
        this.points.forEach(p => {
            p.x -= center.x;
            p.y -= center.y;
            if (this.type === "path") {
                if (p.in) {
                    p.in.x -= center.x;
                    p.in.y -= center.y;
                }
                if (p.out) {
                    p.out.x -= center.x;
                    p.out.y -= center.y;
                }
            }
        });
    }
    getTextBounds() {
        if (this.type !== 'text') return { width: this.size, height: this.size };
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        let fontFamily = this.fontFamily || 'Arial, Helvetica, sans-serif';
        fontFamily = fontFamily.replace(/'/g, '"');
        tempCtx.font = `${this.fontSize}px ${fontFamily}`;
        const metrics = tempCtx.measureText(this.text || 'Hello');
        const width = metrics.width;
        const height = this.fontSize * 1.2;
        return { width, height };
    }
    applyTransformToPoints() {
        if (!(this.type === "polyline" || this.type === "path") || !this.points) return;
        const tanX = Math.tan(this.skewX);
        const tanY = Math.tan(this.skewY);
        this.points.forEach(p => {
            let x = p.x;
            let y = p.y;
            const sx = x + tanX * y;
            const sy = y + tanY * x;
            p.x = sx * this.scaleX;
            p.y = sy * this.scaleY;
            if (this.type === "path" && p.curve) {
                const ix = p.in.x + tanX * p.in.y;
                const iy = p.in.y + tanY * p.in.x;
                p.in.x = ix * this.scaleX;
                p.in.y = iy * this.scaleY;
                const ox = p.out.x + tanX * p.out.y;
                const oy = p.out.y + tanY * p.out.x;
                p.out.x = ox * this.scaleX;
                p.out.y = oy * this.scaleY;
            }
        });
        this.scaleX = 1;
        this.scaleY = 1;
        this.skewX = 0;
        this.skewY = 0;
    }
    _drawDrawing(ctx) {
        if (!this.strokesData || this.strokesData.length === 0) return;
        ctx.save();
        if (this.bgImageObj) {
            ctx.save();
            ctx.beginPath();
            for (let stroke of this.strokesData) {
                const points = stroke.points;
                if (points.length >= 2) {
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let j = 1; j < points.length; j++) {
                        ctx.lineTo(points[j].x, points[j].y);
                    }
                }
            }
            ctx.clip();
            let drawW = this.size;
            let drawH = this.size;
            if (this.bgFit === "contain") {
                const ratio = Math.min(drawW / this.bgImageObj.width, drawH / this.bgImageObj.height);
                drawW = this.bgImageObj.width * ratio;
                drawH = this.bgImageObj.height * ratio;
            } else if (this.bgFit === "cover") {
                const ratio = Math.max(drawW / this.bgImageObj.width, drawH / this.bgImageObj.height);
                drawW = this.bgImageObj.width * ratio;
                drawH = this.bgImageObj.height * ratio;
            }
            const scaledW = drawW * this.bgScale;
            const scaledH = drawH * this.bgScale;
            ctx.drawImage(
                this.bgImageObj, -scaledW / 2 + this.bgOffsetX, -scaledH / 2 + this.bgOffsetY,
                scaledW,
                scaledH
            );
            ctx.restore();
        }
        if (this.strokeFillColors) {
            for (let i = 0; i < this.strokesData.length; i++) {
                const stroke = this.strokesData[i];
                const points = stroke.points;
                const fillColorValue = this._tempFillColors ?.[i] || this.strokeFillColors ?.[i];
                if (fillColorValue && points.length >= 3) {
                    const first = points[0];
                    const last = points[points.length - 1];
                    const isClosed = Math.hypot(first.x - last.x, first.y - last.y) < 15;
                    if (isClosed) {
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let j = 1; j < points.length; j++) {
                            ctx.lineTo(points[j].x, points[j].y);
                        }
                        ctx.closePath();
                        ctx.fillStyle = fillColorValue;
                        ctx.fill();
                    }
                }
            }
        }
        for (let stroke of this.strokesData) {
            drawStroke(ctx, stroke.points, stroke.width, stroke.color, stroke.opacity,
                stroke.brushType, stroke.taperStart, stroke.taperEnd);
        }
        ctx.restore();
    }
    draw(ctx) {
        if (this.visible === false) return;

        if (this.isFloodFill && this.floodFillData) {
            ctx.putImageData(this.floodFillData, this.floodFillBounds.x, this.floodFillBounds.y);
            return;
        }

        const isSoloObject = (soloEditMode && soloEditObject === this);
        const isSelectedObj = (this === selectedShape) || (selectedShapes && selectedShapes.includes(this));
        let cOpacity = 1;

        if (soloEditMode && !isSoloObject && !isSelectedObj) {
            cOpacity = 0.5;
        } else {
            cOpacity = this.opacity;
        }

        if (this.parentGroup) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.transform(this.scaleX, Math.tan(this.skewY), Math.tan(this.skewX), this.scaleY, 0, 0);
            ctx.globalAlpha = cOpacity;
            if (this.type === 'drawing') {
                this._drawDrawing(ctx);
            } else {
                this._drawShapePath(ctx);
                if (!['line', 'polyline', 'path'].includes(this.type)) ctx.fill();
                if (this.bgImageObj && this.type !== 'line') this._drawBackgroundImage(ctx);
                if (this.borderWidth > 0 && this.type !== 'line') {
                    ctx.strokeStyle = this.borderColor;
                    ctx.lineWidth = this.borderWidth;
                    ctx.stroke();
                }
                if (this.type === 'text') {
                    let fontFamily = this.fontFamily || 'Arial, Helvetica, sans-serif';
                    fontFamily = fontFamily.replace(/'/g, '"');
                    ctx.font = `${this.fontSize}px ${fontFamily}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = this.color;
                    ctx.fillText(this.text, 0, 0);
                }
                if (this.type === 'image' && this.imageObj) {
                    const iw = this.size;
                    const ih = this.size * (this.imageObj.height / this.imageObj.width);
                    ctx.drawImage(this.imageObj, -iw / 2, -ih / 2, iw, ih);
                }
            }
            ctx.restore();
            return;
        }
        if (this.type === 'drawing') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.transform(this.scaleX, Math.tan(this.skewY), Math.tan(this.skewX), this.scaleY, 0, 0);
            ctx.globalAlpha = cOpacity;
            if (this.shadowBlur > 0 || this.shadowOffsetX !== 0 || this.shadowOffsetY !== 0) {
                const r = parseInt(this.shadowColor.slice(1, 3), 16);
                const g = parseInt(this.shadowColor.slice(3, 5), 16);
                const b = parseInt(this.shadowColor.slice(5, 7), 16);
                ctx.shadowColor = `rgba(${r},${g},${b},${this.shadowOpacity})`;
                ctx.shadowBlur = this.shadowBlur;
                ctx.shadowOffsetX = this.shadowOffsetX;
                ctx.shadowOffsetY = this.shadowOffsetY;
            }
            this._drawDrawing(ctx);
            ctx.restore();
            if (this.selected && viewport.mode === 'object') {
                this._drawPivotHandle(ctx, cOpacity);
                this.drawHandles(ctx, cOpacity);
            }
            return;
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.transform(this.scaleX, Math.tan(this.skewY), Math.tan(this.skewX), this.scaleY, 0, 0);
        ctx.globalAlpha = cOpacity;
        if (this.shadowBlur > 0 || this.shadowOffsetX !== 0 || this.shadowOffsetY !== 0) {
            const r = parseInt(this.shadowColor.slice(1, 3), 16);
            const g = parseInt(this.shadowColor.slice(3, 5), 16);
            const b = parseInt(this.shadowColor.slice(5, 7), 16);
            ctx.shadowColor = `rgba(${r},${g},${b},${this.shadowOpacity})`;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        if (this.type === 'image') {
            ctx.filter = `brightness(${this.filterBrightness}%) 
                      contrast(${this.filterContrast}%) 
                      saturate(${this.filterSaturation}%) 
                      blur(${this.filterBlur}px)
                      grayscale(${this.filterGrayscale}%)
                      sepia(${this.filterSepia}%)
                      hue-rotate(${this.filterHueRotate}deg)
                      invert(${this.filterInvert}%)`;
        }
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(2, this.borderWidth || 2);
        this._drawShapePath(ctx);
        if (this.type === 'polyline' || this.type === 'path') {
            ctx.stroke();
        } else if (this.type !== 'line') {
            ctx.fill();
        }
        if (this.bgImageObj && this.type !== 'line') {
            this._drawBackgroundImage(ctx);
        }
        if (this.borderWidth > 0 && this.type !== 'line') {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = this.borderWidth;
            ctx.stroke();
            if (this.borderBlur > 0) {
                ctx.shadowColor = this.borderColor;
                ctx.shadowBlur = this.borderBlur;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.stroke();
            }
        }
        if (this.type === 'text') {
            let fontFamily = this.fontFamily || 'Arial, Helvetica, sans-serif';
            if (fontFamily.includes(',')) {
                ctx.font = `${this.fontSize}px ${fontFamily}`;
            } else {
                ctx.font = `${this.fontSize}px ${fontFamily}, Arial, Helvetica, sans-serif`;
            }
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, 0, 0);
            if (this.borderWidth > 0) {
                ctx.strokeStyle = this.borderColor;
                ctx.strokeText(this.text, 0, 0);
            }
        }
        if (this.type === 'image' && this.imageObj) {
            const iw = this.size;
            const ih = this.size * (this.imageObj.height / this.imageObj.width);
            ctx.drawImage(this.imageObj, -iw / 2, -ih / 2, iw, ih);
            if (this.borderWidth > 0) {
                ctx.strokeStyle = this.borderColor;
                ctx.strokeRect(-iw / 2, -ih / 2, iw, ih);
            }
        }
        ctx.restore();
        if (!isDrawing && this.selected && viewport.mode === 'object') {
            this.drawHandles(ctx, cOpacity);
            this._drawPivotHandle(ctx, cOpacity);
        }
        if (this._previewPixels && this._previewPixels.length > 0 && this._previewColor) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            for (let pixel of this._previewPixels) {
                ctx.fillStyle = this._previewColor;
                ctx.fillRect(pixel.x, pixel.y, 1, 1);
            }
            ctx.restore();
        }
    }
    isSegmentClosed(segment) {
        if (!segment || segment.length < 3) return false;
        const first = segment[0];
        const last = segment[segment.length - 1];
        const distance = Math.hypot(first.x - last.x, first.y - last.y);
        return distance < 10;
    }
    _drawShapePath(ctx) {
        ctx.beginPath();
        if (this.type === 'square') {
            const w = this.size,
                h = this.size;
            const r = Math.min(this.cornerRadius, w / 2, h / 2);
            if (r > 0) ctx.roundRect(-w / 2, -h / 2, w, h, r);
            else ctx.rect(-w / 2, -h / 2, w, h);
        } else if (this.type === 'circle') {
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        } else if (this.type === 'triangle') {
            const h = this.size * Math.sqrt(3) / 2;
            ctx.moveTo(0, -h / 2);
            ctx.lineTo(-this.size / 2, h / 2);
            ctx.lineTo(this.size / 2, h / 2);
            ctx.closePath();
        } else if (this.type === 'line') {
            ctx.moveTo(-this.size / 2, 0);
            ctx.lineTo(this.size / 2, 0);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(2, this.borderWidth || 2);
            ctx.stroke();
            return;
        } else if (this.type === 'pentagon') {
            const r = this.size / 2;
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (this.type === 'star') {
            const outer = this.size / 2;
            const inner = outer * 0.5;
            for (let i = 0; i < 10; i++) {
                const angle = Math.PI / 5 * i - Math.PI / 2;
                const r = i % 2 === 0 ? outer : inner;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (this.type === 'arrow') {
            const w = this.size;
            const h = this.size * 0.6;
            ctx.moveTo(-w / 2, -h / 4);
            ctx.lineTo(0, -h / 4);
            ctx.lineTo(0, -h / 2);
            ctx.lineTo(w / 2, 0);
            ctx.lineTo(0, h / 2);
            ctx.lineTo(0, h / 4);
            ctx.lineTo(-w / 2, h / 4);
            ctx.closePath();
        } else if (this.type === 'polygon') {
            const r = this.size / 2;
            const sides = Math.max(3, this.sides || 3);
            for (let i = 0; i < sides; i++) {
                const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        } else if (this.type === 'polyline') {
            if (this.points && this.points.length > 0) {
                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++) {
                    ctx.lineTo(this.points[i].x, this.points[i].y);
                }
                if (this.points.length > 2 && this.finished) {
                    const first = this.points[0];
                    const last = this.points[this.points.length - 1];
                    const isClosed = (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1);
                    if (isClosed) {
                        ctx.closePath();
                        ctx.fillStyle = this.color;
                        ctx.fill();
                    }
                }
            }
            return;
        } else if (this.type === 'path') {
            if (this.points && this.points.length > 0) {
                ctx.beginPath();
                ctx.moveTo(this.points[0].x, this.points[0].y);
                for (let i = 1; i < this.points.length; i++) {
                    const p0 = this.points[i - 1];
                    const p1 = this.points[i];
                    const useCurve = p0.curve || p1.curve ||
                        (p0.out && (p0.out.x !== 0 || p0.out.y !== 0)) ||
                        (p1.in && (p1.in.x !== 0 || p1.in.y !== 0));
                    if (useCurve && p0.out && p1.in) {
                        const cp1x = p0.x + (p0.out.x || 0);
                        const cp1y = p0.y + (p0.out.y || 0);
                        const cp2x = p1.x + (p1.in.x || 0);
                        const cp2y = p1.y + (p1.in.y || 0);
                        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
                    } else {
                        ctx.lineTo(p1.x, p1.y);
                    }
                }
                if (this.points.length > 2 && this.finished) {
                    const first = this.points[0];
                    const last = this.points[this.points.length - 1];
                    const isClosed = (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1);
                    if (isClosed) {
                        ctx.closePath();
                        ctx.fillStyle = this.color;
                        ctx.fill();
                    }
                }
            }
            ctx.strokeStyle = this.borderColor || this.color;
            ctx.lineWidth = this.borderWidth || 2;
            ctx.stroke();
            return;
        }
        ctx.stroke();
    }
    _drawBackgroundImage(ctx) {
        ctx.save();
        ctx.clip();
        const img = this.bgImageObj;
        let drawW = this.size;
        let drawH = this.size;
        if (this.type === 'triangle') {
            drawH = this.size * Math.sqrt(3) / 2;
        }
        if (this.bgFit === "contain") {
            const ratio = Math.min(drawW / img.width, drawH / img.height);
            drawW = img.width * ratio;
            drawH = img.height * ratio;
        } else if (this.bgFit === "cover") {
            const ratio = Math.max(drawW / img.width, drawH / img.height);
            drawW = img.width * ratio;
            drawH = img.height * ratio;
        }
        const scaledW = drawW * this.bgScale;
        const scaledH = drawH * this.bgScale;
        ctx.drawImage(
            img, -scaledW / 2 + this.bgOffsetX, -scaledH / 2 + this.bgOffsetY,
            scaledW,
            scaledH
        );
        ctx.restore();
    }
    _drawPivotHandle(ctx, cOpacity) {
        if (this.parentGroup) return;

        const pivotWorld = this.getPivotWorldPosition();
        ctx.save();
        ctx.globalAlpha = cOpacity;
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--mode-canvas').trim() || '#ff9f43';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / viewport.scale;
        const radius = 10 / viewport.scale;
        const cross = 8 / viewport.scale;
        ctx.beginPath();
        ctx.arc(pivotWorld.x, pivotWorld.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pivotWorld.x - cross, pivotWorld.y);
        ctx.lineTo(pivotWorld.x + cross, pivotWorld.y);
        ctx.moveTo(pivotWorld.x, pivotWorld.y - cross);
        ctx.lineTo(pivotWorld.x, pivotWorld.y + cross);
        ctx.stroke();
        ctx.restore();
    }
    drawHandles(ctx, cOpacity) {
        if (this.parentGroup) return;
        if (isDrawing) return null;

        if (isEditingPolyline && (this.type === "polyline" || this.type === "path")) {
            this._drawPointHandlesOnly(ctx);
            return;
        }
        const handleSize = 10 / viewport.scale;
        const padding = 15 / viewport.scale;
        let baseW = this.size;
        let baseH = this.size;
        if (this.type === 'text') {
            const bounds = this.getTextBounds();
            baseW = bounds.width;
            baseH = bounds.height;
        }
        if (this.type === 'image' && this.imageObj) {
            baseH = this.size * (this.imageObj.height / this.imageObj.width);
        }
        if (this.type === 'triangle') {
            baseH = this.size * Math.sqrt(3) / 2;
        }
        if (this.type === "drawing" || this.type === "polyline" || this.type === "path") {
            const b = this.getGeometryBounds();
            baseW = Math.max(baseW, b.maxX - b.minX);
            baseH = Math.max(baseH, b.maxY - b.minY);
        }
        if (this.type === 'triangle') {
            baseH = this.size * Math.sqrt(3) / 2;
        }

        const halfW = (baseW / 2) * Math.abs(this.scaleX) + padding;
        const halfH = (baseH / 2) * Math.abs(this.scaleY) + padding;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const localToWorld = (lx, ly) => ({
            x: this.x + (lx * cos - ly * sin),
            y: this.y + (lx * sin + ly * cos)
        });
        ctx.save();
        ctx.globalAlpha = cOpacity;
        ctx.shadowColor = "rgba(0,212,255,0.35)";
        ctx.shadowBlur = 10 / viewport.scale;
        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 2 / viewport.scale;
        ctx.setLineDash([6 / viewport.scale, 4 / viewport.scale]);
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
        const p1 = localToWorld(corners[0].x, corners[0].y);
        ctx.moveTo(p1.x, p1.y);
        for (let i = 1; i < corners.length; i++) {
            const p = localToWorld(corners[i].x, corners[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#00d4ff";
        corners.forEach(pos => {
            const world = localToWorld(pos.x, pos.y);
            ctx.save();
            ctx.globalAlpha = cOpacity;
            ctx.translate(world.x, world.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.rect(-handleSize, -handleSize, handleSize * 2, handleSize * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
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
        ctx.strokeStyle = "#ffffff";
        edges.forEach(pos => {
            const world = localToWorld(pos.x, pos.y);
            ctx.beginPath();
            ctx.arc(world.x, world.y, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        ctx.fillStyle = '#ff5ec4';
        const skewOffset = 35 / viewport.scale;
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
        skewHandles.forEach(pos => {
            const world = localToWorld(pos.x, pos.y);
            ctx.save();
            ctx.globalAlpha = cOpacity;
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
        const rotLocalY = -halfH - (45 / viewport.scale);
        const rotWorld = localToWorld(0, rotLocalY);
        const topWorld = localToWorld(0, -halfH);
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
        ctx.shadowBlur = 0;
        ctx.restore();
        if ((this.type === "polyline" || this.type === "path") && this.finished === false && this.points && this.points.length > 0) {
            const pointSize = 8 / viewport.scale;
            this.points.forEach((p, i) => {
                const world = this.localToWorld(p.x, p.y);
                ctx.fillStyle = "#ff5ec4";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2 / viewport.scale;
                ctx.beginPath();
                ctx.arc(world.x, world.y, pointSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                if (this.type === "path" && p.curve) {
                    ctx.strokeStyle = "#00d4ff";
                    ctx.lineWidth = 2 / viewport.scale;
                    if (p.out.x !== 0 || p.out.y !== 0) {
                        const outWorld = this.localToWorld(p.x + p.out.x, p.y + p.out.y);
                        ctx.beginPath();
                        ctx.moveTo(world.x, world.y);
                        ctx.lineTo(outWorld.x, outWorld.y);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(outWorld.x, outWorld.y, pointSize - 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                    if (p.in.x !== 0 || p.in.y !== 0) {
                        const inWorld = this.localToWorld(p.x + p.in.x, p.y + p.in.y);
                        ctx.beginPath();
                        ctx.moveTo(world.x, world.y);
                        ctx.lineTo(inWorld.x, inWorld.y);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(inWorld.x, inWorld.y, pointSize - 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            });
        }
    }
    _drawPointHandlesOnly(ctx) {
        if (!this.points) return;
        const pointSize = 10 / viewport.scale;
        const handleSize = 6 / viewport.scale;
        this.points.forEach((p, i) => {
            const world = this.localToWorld(p.x, p.y);
            ctx.fillStyle = "#ff5ec4";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2 / viewport.scale;
            ctx.beginPath();
            ctx.arc(world.x, world.y, pointSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (this.type === "path" && (p.curve || p.in.x !== 0 || p.in.y !== 0 || p.out.x !== 0 || p.out.y !== 0)) {
                ctx.strokeStyle = "#00d4ff";
                ctx.lineWidth = 2 / viewport.scale;
                ctx.fillStyle = "#00d4ff";
                if (p.out.x !== 0 || p.out.y !== 0) {
                    const outWorld = this.localToWorld(p.x + p.out.x, p.y + p.out.y);
                    ctx.beginPath();
                    ctx.moveTo(world.x, world.y);
                    ctx.lineTo(outWorld.x, outWorld.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(outWorld.x, outWorld.y, handleSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                if (p.in.x !== 0 || p.in.y !== 0) {
                    const inWorld = this.localToWorld(p.x + p.in.x, p.y + p.in.y);
                    ctx.beginPath();
                    ctx.moveTo(world.x, world.y);
                    ctx.lineTo(inWorld.x, inWorld.y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(inWorld.x, inWorld.y, handleSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        });
    }
    isPointInside(px, py) {
        if (this.locked) return false;
        if (this.type === 'group') {
            for (let child of this.children) {
                if (child.isPointInside(px, py)) {
                    return true;
                }
            }
            const local = this.worldToLocal(px, py);
            const bounds = this.getLocalBounds();
            const padding = 20;
            const halfW = Math.max((bounds.maxX - bounds.minX) / 2, 60) + padding;
            const halfH = Math.max((bounds.maxY - bounds.minY) / 2, 60) + padding;
            return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
        }

        if (this.type === 'text') {
            const bounds = this.getTextBounds();
            const halfW = (bounds.width / 2) * Math.abs(this.scaleX) + 15;
            const halfH = (bounds.height / 2) * Math.abs(this.scaleY) + 15;
            const local = this.worldToLocal(px, py);
            return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
        }
        let baseW = this.size;
        let baseH = this.size;
        if (this.type === 'image' && this.imageObj) {
            baseH = this.size * (this.imageObj.height / this.imageObj.width);
        }
        if (this.type === 'triangle') {
            baseH = this.size * Math.sqrt(3) / 2;
        }
        if (this.type === "drawing" || this.type === "polyline" || this.type === "path") {
            const b = this.getGeometryBounds();
            baseW = Math.max(baseW, b.maxX - b.minX);
            baseH = Math.max(baseH, b.maxY - b.minY);
        }
        const padding = 15;
        const halfW = baseW / 2 + padding;
        const halfH = baseH / 2 + padding;
        const local = this.worldToLocal(px, py);
        return Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH;
    }
    getHandleAt(px, py) {
        if (this.parentGroup) return null;
        if (isDrawing) return null;
        if (!this.selected) return null;
        if (this.type === "path" && !this.finished && this.points) {
            for (let i = 0; i < this.points.length; i++) {
                const hitR = 20 / (viewport ? .scale || 1);
                const p = this.points[i];
                if (p.out && (p.out.x !== 0 || p.out.y !== 0)) {
                    const outWorld = this.localToWorld(p.x + p.out.x, p.y + p.out.y);
                    if (Math.hypot(px - outWorld.x, py - outWorld.y) < hitR) {
                        return {
                            type: "path-handle",
                            index: i,
                            handle: "out"
                        };
                    }
                }
                if (p.in && (p.in.x !== 0 || p.in.y !== 0)) {
                    const inWorld = this.localToWorld(p.x + p.in.x, p.y + p.in.y);
                    if (Math.hypot(px - inWorld.x, py - inWorld.y) < hitR) {
                        return {
                            type: "path-handle",
                            index: i,
                            handle: "in"
                        };
                    }
                }
            }
        }
        if ((this.type === 'drawing' || this.type === "polyline" || this.type === "path") && !this.finished && this.points) {
            const hitR = 20 / (viewport ? .scale || 1);
            for (let i = 0; i < this.points.length; i++) {
                const p = this.points[i];
                const world = this.localToWorld(p.x, p.y);
                if (Math.hypot(px - world.x, py - world.y) < hitR) {
                    return {
                        type: "poly-point",
                        index: i
                    };
                }
            }
        }

        const hitR = 20 / (viewport ? .scale || 1);
        let baseW = this.size;
        let baseH = this.size;
        if (this.type === 'text') {
            const bounds = this.getTextBounds();
            baseW = bounds.width;
            baseH = bounds.height;
        } else if (this.type === 'image' && this.imageObj) {
            baseH = this.size * (this.imageObj.height / this.imageObj.width);
        }
        if (this.type === 'triangle') {
            baseH = this.size * Math.sqrt(3) / 2;
        }
        if (this.type === "polyline" || this.type === "path") {
            const b = this.getGeometryBounds();
            baseW = Math.max(baseW, b.maxX - b.minX);
            baseH = Math.max(baseH, b.maxY - b.minY);
        }
        const scaledW = baseW * Math.abs(this.scaleX);
        const scaledH = baseH * Math.abs(this.scaleY);
        const pad = 12 / (viewport ? .scale || 1);
        const halfW = scaledW / 2 + pad;
        const halfH = scaledH / 2 + pad;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const toWorld = (lx, ly) => ({
            x: this.x + (lx * cos - ly * sin),
            y: this.y + (lx * sin + ly * cos)
        });
        const rotY = -halfH - 35 / (viewport ? .scale || 1);
        const rotW = toWorld(0, rotY);
        if (Math.hypot(px - rotW.x, py - rotW.y) < hitR) return 'rotate';
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
        for (const c of corners) {
            const w = toWorld(c.x, c.y);
            if (Math.hypot(px - w.x, py - w.y) < hitR) return 'scale';
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
        for (const e of edges) {
            const w = toWorld(e.x, e.y);
            if (Math.hypot(px - w.x, py - w.y) < hitR) return e.id;
        }
        const skews = [{
                x: 0,
                y: -halfH - 20 / (viewport ? .scale || 1),
                id: 'skewY'
            },
            {
                x: 0,
                y: halfH + 20 / (viewport ? .scale || 1),
                id: 'skewY'
            },
            {
                x: -halfW - 20 / (viewport ? .scale || 1),
                y: 0,
                id: 'skewX'
            },
            {
                x: halfW + 20 / (viewport ? .scale || 1),
                y: 0,
                id: 'skewX'
            }
        ];
        for (const s of skews) {
            const w = toWorld(s.x, s.y);
            if (Math.hypot(px - w.x, py - w.y) < hitR) return s.id;
        }
        const pv = this.getPivotWorldPosition();
        if (Math.hypot(px - pv.x, py - pv.y) < hitR) return 'pivot';
        const local = this.worldToLocal(px, py);
        const dragHalfW = baseW / 2 + 12;
        const dragHalfH = baseH / 2 + 12;
        if (Math.abs(local.x) <= dragHalfW && Math.abs(local.y) <= dragHalfH) {
            return 'drag';
        }
        if ((this.type === "polyline" || this.type === "path") && !this.finished && this.points) {
            for (let i = 0; i < this.points.length; i++) {
                const p = this.points[i];
                const w = this.localToWorld(p.x, p.y);
                if (Math.hypot(px - w.x, py - w.y) < hitR) return {
                    type: "poly-point",
                    index: i
                };
                if (this.type === "path" && p.curve) {
                    const ow = this.localToWorld(p.x + p.out.x, p.y + p.out.y);
                    if (Math.hypot(px - ow.x, py - ow.y) < hitR) return {
                        type: "path-handle",
                        index: i,
                        handle: "out"
                    };
                    const iw = this.localToWorld(p.x + p.in.x, p.y + p.in.y);
                    if (Math.hypot(px - iw.x, py - iw.y) < hitR) return {
                        type: "path-handle",
                        index: i,
                        handle: "in"
                    };
                }
            }
        }
        return null;
    }
}
