import { parseAndRender } from './core.js';
import { setupTabEvents, setupResizer, setupButtonEvents, checkScreenSize } from './ui.js';

// Referencias globales
const markdownEditor = document.getElementById('markdown-editor');
const formPreview = document.getElementById('form-preview');

function init() {
    setupTabEvents();
    setupResizer();
    setupButtonEvents(markdownEditor, formPreview);
    checkScreenSize();
    parseAndRender(markdownEditor.value);
}

document.addEventListener('DOMContentLoaded', init);