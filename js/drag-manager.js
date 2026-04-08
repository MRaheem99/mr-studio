class DragManager {
    constructor() {
        this.activeModal = null;
        this.shiftX = 0;
        this.shiftY = 0;
        this.isDragging = false;
    }

    init() {
        const headers = document.querySelectorAll('.popup-header');
        headers.forEach(header => {
            header.classList.add('modal-header-drag-handle');
            header.addEventListener('mousedown', (e) => this.onDragStart(e));
            header.addEventListener('touchstart', (e) => this.onDragStart(e), {
                passive: false
            });
        });

        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        document.addEventListener('touchmove', (e) => this.onDragMove(e), {
            passive: false
        });
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
    }

    onDragStart(e) {
        if(e.target.closest('button')) return;
        const header = e.target.closest('.popup-header');
        if(!header) return;

        const popups = document.querySelectorAll('.modal-overlay');
        popups.forEach(element => {
            element.style.zIndex = 10;
        });

        this.activeModal = header.parentElement;
        this.activeModal.parentElement.style.zIndex = (popups.length * 10) + 1;
        const rect = this.activeModal.getBoundingClientRect();
        if(e.type === 'touchstart') {
            this.shiftX = e.touches[0].clientX - rect.left;
            this.shiftY = e.touches[0].clientY - rect.top;
        } else {
            this.shiftX = e.clientX - rect.left;
            this.shiftY = e.clientY - rect.top;
        }

        this.activeModal.style.position = 'fixed';
        this.activeModal.style.top = rect.top + 'px';
        this.activeModal.style.left = rect.left + 'px';
        this.activeModal.style.bottom = 'auto';
        this.activeModal.style.right = 'auto';
        this.activeModal.style.margin = '0';
        this.activeModal.style.transform = 'none';

        this.activeModal.style.transition = 'none';
        this.activeModal.classList.add('is-dragging');

        this.isDragging = true;
    }

    onDragMove(e) {
        if(!this.isDragging || !this.activeModal) return;

        if(e.type === 'touchmove') {
            e.preventDefault();
        }

        let clientX, clientY;

        if(e.type === 'touchmove') {
            if(!e.touches || e.touches.length === 0) return;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        let newLeft = clientX - this.shiftX;
        let newTop = clientY - this.shiftY;

        const maxX = window.innerWidth - this.activeModal.offsetWidth;
        const maxY = window.innerHeight - this.activeModal.offsetHeight;

        newLeft = Math.max(-50, Math.min(newLeft, maxX + 50));
        newTop = Math.max(-50, Math.min(newTop, maxY + 50));

        this.activeModal.style.left = newLeft + 'px';
        this.activeModal.style.top = newTop + 'px';
    }

    onDragEnd(e) {
        if(!this.isDragging) return;
        this.isDragging = false;

        if(this.activeModal) {
            this.activeModal.classList.remove('is-dragging');
            this.activeModal = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DragManager().init();
});