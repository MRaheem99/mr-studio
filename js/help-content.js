const helpContent = `
    <div style="padding: 5px;">
        <!-- Quick Start -->
        <div class="help-section">
            <h3><i class="fa-solid fa-rocket"></i> Quick Start</h3>
            <p>MR Studio is a professional animation tool that allows you to create vector animations, draw freehand, add keyframes, and export in multiple formats.</p>
            <div class="help-tip">
                <i class="fa-solid fa-lightbulb"></i> Tip: Double-click on any shape to edit its properties or path points!
            </div>
        </div>

        <!-- Getting Started -->
        <div class="help-section">
            <h3><i class="fa-solid fa-play"></i> Getting Started</h3>
            <ol>
                <li><strong>Create Shapes:</strong> Click the "Add Shape" button or press <kbd>N</kbd> to add shapes to the canvas</li>
                <li><strong>Select Objects:</strong> Click on objects to select them, or use <kbd>Ctrl + A</kbd> to select all</li>
                <li><strong>Transform Objects:</strong> Use the handles (corners, edges, rotation) to transform selected objects</li>
                <li><strong>Add Keyframes:</strong> Click on the timeline to add keyframes, then modify object properties</li>
                <li><strong>Play Animation:</strong> Press <kbd>Space</kbd> to play/pause your animation</li>
            </ol>
        </div>

        <!-- Drawing Tools -->
        <div class="help-section">
            <h3><i class="fa-solid fa-paintbrush"></i> Drawing Tools</h3>
            <div class="help-grid">
                <div class="help-item">
                    <span class="help-icon"><i class="fa-solid fa-pencil"></i></span>
                    <div>
                        <strong>Pencil (<kbd>P</kbd>)</strong>
                        <p>Freehand drawing with stabilization. Click Finish to convert to shape.</p>
                    </div>
                </div>
                <div class="help-item">
                    <span class="help-icon"><i class="fa-solid fa-paintbrush"></i></span>
                    <div>
                        <strong>Brush (<kbd>B</kbd>)</strong>
                        <p>Thick brush strokes with multiple brush types (Solid, Tapered, Dotted, etc.)</p>
                    </div>
                </div>
                <div class="help-item">
                    <span class="help-icon"><i class="fa-solid fa-eraser"></i></span>
                    <div>
                        <strong>Eraser (<kbd>E</kbd>)</strong>
                        <p>Erase shapes by clicking on them</p>
                    </div>
                </div>
                <div class="help-item">
                    <span class="help-icon"><i class="fa-solid fa-fill-drip"></i></span>
                    <div>
                        <strong>Fill Bucket</strong>
                        <p>Fill closed shapes with color</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shape Types -->
        <div class="help-section">
            <h3><i class="fa-solid fa-shapes"></i> Shape Types</h3>
            <div class="help-grid">
                <div class="help-item"><span class="help-icon">□</span> Square</div>
                <div class="help-item"><span class="help-icon">●</span> Circle</div>
                <div class="help-item"><span class="help-icon">▲</span> Triangle</div>
                <div class="help-item"><span class="help-icon">─</span> Line</div>
                <div class="help-item"><span class="help-icon">⬟</span> Pentagon</div>
                <div class="help-item"><span class="help-icon">★</span> Star</div>
                <div class="help-item"><span class="help-icon">➡</span> Arrow</div>
                <div class="help-item"><span class="help-icon">⬟</span> Polygon</div>
                <div class="help-item"><span class="help-icon">✎</span> Polyline</div>
                <div class="help-item"><span class="help-icon">⎚</span> Path/Bezier</div>
                <div class="help-item"><span class="help-icon">📝</span> Text</div>
                <div class="help-item"><span class="help-icon">🖼️</span> Image</div>
            </div>
        </div>

        <!-- Transform Controls -->
        <div class="help-section">
            <h3><i class="fa-solid fa-arrows-spin"></i> Transform Controls</h3>
            <ul>
                <li><strong>Corner Handles (White)</strong> - Scale uniformly</li>
                <li><strong>Edge Handles (Orange)</strong> - Stretch in one direction</li>
                <li><strong>Skew Handles (Pink)</strong> - Skew the object</li>
                <li><strong>Rotation Handle (Blue)</strong> - Rotate the object</li>
                <li><strong>Pivot Handle (Orange)</strong> - Change rotation pivot point</li>
                <li><strong>Dashed Box</strong> - Click and drag to move the object</li>
            </ul>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="help-section">
            <h3><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</h3>
            <div class="shortcuts-grid">
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-arrow-pointer"></i> Selection & Transform</h4>
                    <div class="shortcut-item"><kbd>V</kbd> Object Mode</div>
                    <div class="shortcut-item"><kbd>H</kbd> Canvas Mode (Pan)</div>
                    <div class="shortcut-item"><kbd>←↑↓→</kbd> Move 1px</div>
                    <div class="shortcut-item"><kbd>Shift + ←↑↓→</kbd> Move 10px</div>
                    <div class="shortcut-item"><kbd>Ctrl + ←→</kbd> Rotate 5°</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + ←→</kbd> Rotate 15°</div>
                    <div class="shortcut-item"><kbd>Delete</kbd> Delete selected</div>
                    <div class="shortcut-item"><kbd>Ctrl + A</kbd> Select All</div>
                    <div class="shortcut-item"><kbd>Esc</kbd> Clear selection</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-regular fa-copy"></i> Copy & Paste</h4>
                    <div class="shortcut-item"><kbd>Ctrl + C</kbd> Copy</div>
                    <div class="shortcut-item"><kbd>Ctrl + V</kbd> Paste</div>
                    <div class="shortcut-item"><kbd>Ctrl + X</kbd> Cut</div>
                    <div class="shortcut-item"><kbd>Ctrl + D</kbd> Duplicate</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-layer-group"></i> Layer Order</h4>
                    <div class="shortcut-item"><kbd>Ctrl + ]</kbd> Bring Forward</div>
                    <div class="shortcut-item"><kbd>Ctrl + [</kbd> Send Backward</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + ]</kbd> Bring to Front</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + [</kbd> Send to Back</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-wand-magic"></i> Transform</h4>
                    <div class="shortcut-item"><kbd>Ctrl + R</kbd> Reset Transform</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + H</kbd> Flip Horizontal</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + V</kbd> Flip Vertical</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + C</kbd> Center Object</div>
                    <div class="shortcut-item"><kbd>Ctrl + L</kbd> Lock/Unlock</div>
                    <div class="shortcut-item"><kbd>Ctrl + H</kbd> Hide/Show</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-draw-polygon"></i> Drawing</h4>
                    <div class="shortcut-item"><kbd>P</kbd> Pencil Tool</div>
                    <div class="shortcut-item"><kbd>B</kbd> Brush Tool</div>
                    <div class="shortcut-item"><kbd>E</kbd> Eraser Tool</div>
                    <div class="shortcut-item"><kbd>F</kbd> Finish Drawing</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-film"></i> Animation</h4>
                    <div class="shortcut-item"><kbd>Space</kbd> Play/Pause</div>
                    <div class="shortcut-item"><kbd>Home</kbd> Go to Start</div>
                    <div class="shortcut-item"><kbd>End</kbd> Go to End</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-file"></i> File</h4>
                    <div class="shortcut-item"><kbd>Ctrl + S</kbd> Save Project</div>
                    <div class="shortcut-item"><kbd>Ctrl + O</kbd> Open Project</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + E</kbd> Export</div>
                    <div class="shortcut-item"><kbd>Ctrl + Shift + N</kbd> New Project</div>
                </div>
                
                <div class="shortcut-category">
                    <h4><i class="fa-solid fa-undo"></i> History</h4>
                    <div class="shortcut-item"><kbd>Ctrl + Z</kbd> Undo</div>
                    <div class="shortcut-item"><kbd>Ctrl + Y</kbd> Redo</div>
                </div>
            </div>
        </div>

        <!-- Animation Controls -->
        <div class="help-section">
            <h3><i class="fa-solid fa-chart-line"></i> Animation Tips</h3>
            <ul>
                <li><strong>Keyframes:</strong> Click on the timeline to add keyframes at any time</li>
                <li><strong>Easing:</strong> Choose from 12 easing types (Linear, Ease In/Out, Bounce, Elastic, etc.)</li>
                <li><strong>Interpolation:</strong> Smooth interpolation between keyframes creates fluid animations</li>
                <li><strong>Group Animation:</strong> Groups can have keyframes - all children animate together</li>
            </ul>
        </div>

        <!-- Export Options -->
        <div class="help-section">
            <h3><i class="fa-solid fa-download"></i> Export Options</h3>
            <ul>
                <li><strong>WebM Video:</strong> High-quality video with transparency support</li>
                <li><strong>Animated GIF:</strong> Shareable animated GIFs</li>
                <li><strong>PNG Sequence:</strong> Export each frame as PNG (ZIP archive)</li>
                <li><strong>Project JSON:</strong> Save your project for later editing</li>
            </ul>
        </div>

        <!-- Troubleshooting -->
        <div class="help-section">
            <h3><i class="fa-solid fa-bug"></i> Troubleshooting</h3>
            <div class="help-tip">
                <i class="fa-solid fa-info-circle"></i> <strong>Can't select an object?</strong> Make sure you're in Object Mode (<kbd>V</kbd>)
            </div>
            <div class="help-tip">
                <i class="fa-solid fa-info-circle"></i> <strong>Animation not playing?</strong> Add keyframes first - click on the timeline to add keyframes
            </div>
            <div class="help-tip">
                <i class="fa-solid fa-info-circle"></i> <strong>Drawing not visible?</strong> Click "Finish Drawing" to convert to shape
            </div>
            <div class="help-tip">
                <i class="fa-solid fa-info-circle"></i> <strong>Export failed?</strong> Make sure you have keyframes and try reducing quality or resolution
            </div>
        </div>

        <!-- Support -->
        <div class="help-section">
            <h3><i class="fa-solid fa-headset"></i> Support</h3>
            <p>Need help? Check out these resources:</p>
            <ul>
                <li><i class="fa-regular fa-file-lines"></i> <a href="https://mrstudio.phavio.com" id="docLink">Online Documentation</a></li>
                <li><i class="fa-brands fa-github"></i> <a href="https://mrstudio.phavio.com" id="githubLink">GitHub Repository</a></li>
                <li><i class="fa-regular fa-envelope"></i> <a href="https://mrstudio.phavio.com" id="emailLink">Email Support</a></li>
            </ul>
        </div>
    </div>
`;

function loadHelpContent() {
    const helpContentDiv = document.getElementById('helpContent');
    if (helpContentDiv) {
        helpContentDiv.innerHTML = helpContent;
        
        const docLink = document.getElementById('docLink');
        const githubLink = document.getElementById('githubLink');
        const emailLink = document.getElementById('emailLink');
        
        if (docLink) {
            docLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.open('https://mrstudio.phavio.com', '_blank');
            });
        }
        
        if (githubLink) {
            githubLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.open('https://github.com/mraheem99/mr-animator', '_blank');
            });
        }
        
        if (emailLink) {
            emailLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'mraheem764@gmail.com';
            });
        }
    }
}
