
async function showConfirmDialog(title, message, onConfirm, onCancel, options = {}) {
    return new Promise((resolve) => {
        const { isPrompt = false, inputValue = '', inputPlaceholder = '', isAlert = false } = options;
        
        const popups = document.querySelectorAll('.modal-overlay');
        popups.forEach(element => {
            element.style.zIndex = 50;
        });
        
        let confirmModal = document.getElementById('confirmDialog');
        if(!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = 'confirmDialog';
            confirmModal.className = 'modal-overlay';
            confirmModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000000;
            `;
            confirmModal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="popup-header">
                        <span class="popup-title" id="confirmTitle">Confirm</span>
                        <button class="close-popup-btn" id="closeConfirmBtn"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="popup-body">
                        <p id="confirmMessage" style="margin-bottom: 20px;">Are you sure?</p>
                        <div id="promptInputContainer" style="display: none; margin-bottom: 15px;">
                            <input type="text" id="promptInput" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 6px; color: var(--text-main);">
                        </div>
                        <div class="btn-grid" id="dialogButtons" style="grid-template-columns: 1fr 1fr;">
                            <button class="action-btn" id="confirmCancelBtn">Cancel</button>
                            <button class="action-btn btn-primary" id="confirmOkBtn">OK</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);
        }
        
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const promptContainer = document.getElementById('promptInputContainer');
        const promptInput = document.getElementById('promptInput');
        const dialogButtons = document.getElementById('dialogButtons');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const okBtn = document.getElementById('confirmOkBtn');
        
        if (isAlert) {
            dialogButtons.style.gridTemplateColumns = '1fr';
            cancelBtn.style.display = 'none';
        } else {
            dialogButtons.style.gridTemplateColumns = '1fr 1fr';
            cancelBtn.style.display = 'block';
        }
        
        if (isPrompt) {
            promptContainer.style.display = 'block';
            promptInput.value = inputValue;
            promptInput.placeholder = inputPlaceholder;
            setTimeout(() => promptInput.focus(), 100);
        } else {
            promptContainer.style.display = 'none';
        }
        
        const closeBtn = document.getElementById('closeConfirmBtn');
        
        const newCloseBtn = closeBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newOkBtn = okBtn.cloneNode(true);
        
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        
        const closeDialog = (result = false, value = null) => {
            confirmModal.remove();
            resolve(result);
            if (onCancel && !isAlert && !result) onCancel();
            if (onConfirm && result) onConfirm(value);
        };
        
        newCloseBtn.addEventListener('click', () => closeDialog(false));
        
        if (!isAlert) {
            newCancelBtn.addEventListener('click', () => closeDialog(false));
        }
        
        newOkBtn.addEventListener('click', () => {
            const inputValue = isPrompt ? promptInput.value : null;
            closeDialog(true, inputValue);
        });
        
        confirmModal.addEventListener('click', (e) => {
            if(e.target === confirmModal) {
                closeDialog(false);
            }
        });
        
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputValue = isPrompt ? promptInput.value : null;
                closeDialog(true, inputValue);
            } else if (e.key === 'Escape') {
                closeDialog(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        confirmModal._handleKeyDown = handleKeyDown;
        
        confirmModal.classList.add('open');
    });
}

function showPrompt(message, defaultValue = '', callback) {
    const popups = document.querySelectorAll('.modal-overlay');
    popups.forEach(element => {
        element.style.zIndex = 50;
    });
    
    let confirmModal = document.getElementById('confirmDialog');
    if(!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmDialog';
        confirmModal.className = 'modal-overlay';
        confirmModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000000;
        `;
        confirmModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="popup-header">
                    <span class="popup-title" id="confirmTitle">Input Required</span>
                    <button class="close-popup-btn" id="closeConfirmBtn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="popup-body">
                    <p id="confirmMessage" style="margin-bottom: 20px;"></p>
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="promptInput" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid var(--border); border-radius: 6px; color: var(--text-main);">
                    </div>
                    <div class="btn-grid" style="grid-template-columns: 1fr 1fr;">
                        <button class="action-btn" id="confirmCancelBtn">Cancel</button>
                        <button class="action-btn btn-primary" id="confirmOkBtn">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
    }
    
    document.getElementById('confirmTitle').textContent = "Input Required";
    document.getElementById('confirmMessage').textContent = message;
    
    const promptInput = document.getElementById('promptInput');
    promptInput.value = defaultValue;
    setTimeout(() => promptInput.focus(), 100);
    
    const closeBtn = document.getElementById('closeConfirmBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    const okBtn = document.getElementById('confirmOkBtn');
    
    const newCloseBtn = closeBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newOkBtn = okBtn.cloneNode(true);
    
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    const closeDialog = () => {
        confirmModal.remove();
        if(callback) callback(null);
    };
    
    newCloseBtn.addEventListener('click', closeDialog);
    newCancelBtn.addEventListener('click', closeDialog);
    
    newOkBtn.addEventListener('click', () => {
        const value = promptInput.value;
        confirmModal.remove();
        if(callback) callback(value);
    });
    
    confirmModal.addEventListener('click', (e) => {
        if(e.target === confirmModal) {
            closeDialog();
        }
    });
    
    confirmModal.classList.add('open');
}

    /*
    function showAlert(message, title = "Information") {
        showConfirmDialog(title, message, () => {}, null, { isAlert: true });
    }
    
    // Usage:
    showAlert("Drawing finished! Shape created", "Success");
    
    function showConfirm(message, title = "Confirm", onYes, onNo) {
        showConfirmDialog(title, message, onYes, onNo);
    }
    
    // Usage:
    showConfirm("Delete this shape?", "Confirm Delete", () => {
        // Delete shape
        console.log("Deleted");
    }, () => {
        console.log("Cancelled");
    });
    
    /////
    showPrompt("Enter bookmark name:", bookmark.name, (newName) => {
        if (newName && newName.trim()) {
            bookmark.name = newName;
            drawTimelineRuler();
        }
    });
    /////

    if(!(await showConfirmDialog("Confirm", "Are you sure?"))) {
        return;
    }
    
    **** For export video:
    if(!(await showConfirmDialog("Export Video", `Export video? This will play the animation from start to finish (${window.animationState.duration.toFixed(1)}s).`))) {
        return;
    }
    
    **** For alert (no return value needed)
    await showConfirmDialog("Information", "Your file has been saved!", null, null, { isAlert: true });
    
    **** For prompt - returns the input value
    const userName = await showConfirmDialog("Input", "Enter your name:", null, null, { 
        isPrompt: true, 
        inputValue: "Default Name" 
    });
    */
