class PopupManager {
    constructor() {
        this.zIndex = 50;
        this.stack = [];
    }
    register(popup) {
        if(!popup) return;
        popup.style.zIndex = ++this.zIndex;
        if(!this.stack.includes(popup)) {
            this.stack.push(popup);
        }
    }
    bringToFront(popup) {
        if(!popup) return;
        const popups = document.querySelectorAll('.modal-content');
        popups.forEach(element => {
            element.style.zIndex = 50;
        });
        this.zIndex++;
        popup.style.zIndex = (popups.length * 50) + 1;
        const i = this.stack.indexOf(popup);
        if(i > -1) this.stack.splice(i, 1);
        this.stack.push(popup);
    }
    closeTopPopup() {
        if(this.stack.length === 0) return;
        const popup = this.stack[this.stack.length - 1];
        if(!popup.classList.contains("open")) return;
        popup.classList.remove("open");
        this.stack.pop();
    }
}
window.popupManager = new PopupManager();
document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") {
        window.popupManager.closeTopPopup();
    }
});