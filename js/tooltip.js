
function initCustomTooltips() {
    const elementsWithTitle = document.querySelectorAll('[title]');
    
    elementsWithTitle.forEach(el => {
        const titleText = el.getAttribute('title');
        if (!titleText) return;
        
        el.setAttribute('data-tooltip', titleText);
        el.removeAttribute('title');
        
        el.addEventListener('mouseenter', (e) => showTooltip(e, titleText));
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('mousemove', moveTooltip);
    });
}

function showTooltip(event, text) {
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    if (activeTooltip) activeTooltip.remove();
    
    activeTooltip = document.createElement('div');
    activeTooltip.className = 'custom-tooltip';
    activeTooltip.textContent = text;
    activeTooltip.style.cssText = `
        position: fixed;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #00d4ff;
        font-size: 0.75rem;
        padding: 6px 12px;
        border-radius: 6px;
        white-space: nowrap;
        z-index: 999999;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(0, 212, 255, 0.4);
        font-family: 'Segoe UI', Roboto, sans-serif;
        pointer-events: none;
        backdrop-filter: blur(4px);
    `;
    
    document.body.appendChild(activeTooltip);
    
    updateTooltipPosition(event);
}

function moveTooltip(event) {
    if (activeTooltip) {
        updateTooltipPosition(event);
    }
}

function updateTooltipPosition(event) {
    if (!activeTooltip) return;
    
    const x = event.clientX + 15;
    const y = event.clientY - 35;
    const tooltipRect = activeTooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalX = x;
    let finalY = y;
    
    if (x + tooltipRect.width > viewportWidth) {
        finalX = event.clientX - tooltipRect.width - 15;
    }
    
    if (y < 0) {
        finalY = event.clientY + 25;
    }
    
    activeTooltip.style.left = finalX + 'px';
    activeTooltip.style.top = finalY + 'px';
}

function hideTooltip() {
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomTooltips);
} else {
    initCustomTooltips();
}

const observer = new MutationObserver(() => {
    initCustomTooltips();
});
observer.observe(document.body, { childList: true, subtree: true });
