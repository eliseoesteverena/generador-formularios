
import { parseAndRender, parseMarkdown, markdownEditor } from './core.js';
import { setupTabEvents, setupResizer, setupButtonEvents, checkScreenSize } from './ui.js';
import { setupWysiwygObserver } from './syncBlock.js';

// Referencias globales
const formPreview = document.getElementById('form-preview');

function init() {
    setupTabEvents();
    setupResizer();
    setupButtonEvents(markdownEditor, formPreview);
    checkScreenSize();

    let parsedContent = parseMarkdown(markdownEditor.value);
    parseAndRender(markdownEditor.value);
    
    setupWysiwygObserver()
}
document.addEventListener('DOMContentLoaded', init);