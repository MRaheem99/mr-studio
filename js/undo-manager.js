class UndoManager {
    constructor(maxSteps = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSteps = maxSteps;
        this.isBatching = false;
        this.batchCommands = [];
    }
    execute(command) {
        if(!command) return;
        if(!this.isBatching) {
            this.redoStack = [];
        }
        if(this.isBatching) {
            command.execute();
            this.batchCommands.push(command);
        } else {
            command.execute();
            this._pushUndo(command);
        }
    }
    _pushUndo(command) {
        if(!command) return;
        this.undoStack.push(command);
        if(this.undoStack.length > this.maxSteps) {
            this.undoStack.shift();
        }
    }
    undo() {
        if(this.undoStack.length === 0) return false;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
        return true;
    }
    redo() {
        if(this.redoStack.length === 0) return false;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
        return true;
    }
    startBatch() {
        this.isBatching = true;
        this.batchCommands = [];
    }
    endBatch() {
        this.isBatching = false;
        if(this.batchCommands.length > 0) {
            const commands = [...this.batchCommands];
            const batch = {
                execute: () => commands.forEach(c => c.execute()),
                undo: () => {
                    for(let i = commands.length - 1; i >= 0; i--) {
                        commands[i].undo();
                    }
                }
            };
            this._pushUndo(batch);
        }
        this.batchCommands = [];
    }
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.batchCommands = [];
        this.isBatching = false;
    }
    getStackInfo() {
        return {
            undo: this.undoStack.length,
            redo: this.redoStack.length
        };
    }
}
class PropertyCommand {
    constructor(target, property, oldValue, newValue, onApply) {
        this.target = target;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.onApply = onApply;
    }
    execute() {
        this.target[this.property] = this.newValue;
        if(this.onApply) this.onApply(this.newValue);
    }
    undo() {
        this.target[this.property] = this.oldValue;
        if(this.onApply) this.onApply(this.oldValue);
    }
}
class ObjectStateCommand {
    constructor(shape, oldState, newState, redraw) {
        this.shape = shape;
        this.oldState = {
            ...oldState
        };
        this.newState = {
            ...newState
        };
        this.redraw = redraw;
    }
    execute() {
        Object.assign(this.shape, this.newState);
        if(this.redraw) this.redraw();
    }
    undo() {
        Object.assign(this.shape, this.oldState);
        if(this.redraw) this.redraw();
    }
}
class ObjectLifecycleCommand {
    constructor(shapesArray, shape, action, selectedIndex, redraw) {
        this.shapesArray = shapesArray;
        this.shape = shape;
        this.action = action;
        this.selectedIndex = selectedIndex;
        this.redraw = redraw;
    }
    execute() {
        if(this.action === 'add') {
            this.shapesArray.push(this.shape);
            if(this.selectedIndex !== undefined) {
                this.shapesArray.forEach((s, i) => s.selected = i === this.selectedIndex);
            }
        } else {
            const idx = this.shapesArray.indexOf(this.shape);
            if(idx > -1) this.shapesArray.splice(idx, 1);
        }
        if(this.redraw) this.redraw();
    }
    undo() {
        if(this.action === 'add') {
            const idx = this.shapesArray.indexOf(this.shape);
            if(idx > -1) this.shapesArray.splice(idx, 1);
        } else {
            this.shapesArray.push(this.shape);
            if(this.selectedIndex !== undefined) {
                this.shapesArray.forEach((s, i) => s.selected = i === this.selectedIndex);
            }
        }
        if(this.redraw) this.redraw();
    }
}
class KeyframeCommand {
    constructor(shape, action, index, keyframeData, redraw, updateDuration) {
        this.shape = shape;
        this.action = action;
        this.index = index;
        this.keyframeData = keyframeData;
        this.redraw = redraw;
        this.updateDuration = updateDuration;
    }
    execute() {
        if(this.action === 'add') {
            this.shape.keyframes.push(this.keyframeData);
            this.shape.keyframes.sort((a, b) => a.time - b.time);
        } else if(this.action === 'delete') {
            this.shape.keyframes.splice(this.index, 1);
        } else if(this.action === 'update') {
            this.oldData = this.shape.keyframes[this.index];
            this.shape.keyframes[this.index].state = this.keyframeData.newState;
        }
        if(this.redraw) this.redraw();
        if(this.updateDuration) this.updateDuration();
    }
    undo() {
        if(this.action === 'add') {
            const idx = this.shape.keyframes.findIndex(k => Math.abs(k.time - this.keyframeData.time) < 0.01);
            if(idx > -1) this.shape.keyframes.splice(idx, 1);
        } else if(this.action === 'delete') {
            this.shape.keyframes.splice(this.index, 0, this.keyframeData);
            this.shape.keyframes.sort((a, b) => a.time - b.time);
        } else if(this.action === 'update') {
            this.shape.keyframes[this.index].state = this.keyframeData.oldState;
        }
        if(this.redraw) this.redraw();
        if(this.updateDuration) this.updateDuration();
    }
}
class GroupCommand {
    constructor(shapesArray, group, shapesToGroup, oldShapes, action) {
        this.shapesArray = shapesArray;
        this.group = group;
        this.shapesToGroup = shapesToGroup;
        this.oldShapes = oldShapes;
        this.action = action;
    }
    execute() {
        if(this.action === 'group') {
            this.shapesToGroup.forEach(shape => {
                const idx = this.shapesArray.indexOf(shape);
                if(idx !== -1) this.shapesArray.splice(idx, 1);
            });
            this.shapesArray.push(this.group);
        } else {
            const idx = this.shapesArray.indexOf(this.group);
            if(idx !== -1) this.shapesArray.splice(idx, 1);
            this.oldShapes.forEach(shape => {
                this.shapesArray.push(shape);
            });
        }
        if(this.redraw) this.redraw();
    }
    undo() {
        if(this.action === 'group') {
            const idx = this.shapesArray.indexOf(this.group);
            if(idx !== -1) this.shapesArray.splice(idx, 1);
            this.oldShapes.forEach(shape => {
                this.shapesArray.push(shape);
            });
        } else {
            this.oldShapes.forEach(shape => {
                const idx = this.shapesArray.indexOf(shape);
                if(idx !== -1) this.shapesArray.splice(idx, 1);
            });
            this.shapesArray.push(this.group);
        }
        if(this.redraw) this.redraw();
    }
}
window.undoManager = new UndoManager(50);
