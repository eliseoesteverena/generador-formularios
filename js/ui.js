import { parseAndRender } from './core.js';
import { convertTxtToMarkdown, convertDocxToMarkdown, convertPdfToMarkdown } from './file-converter.js';
import { parseToJson, renderFromJson } from './json-parser.js';

// Estado de la aplicación
let currentTab = 'editor';
let isMobile = window.innerWidth <= 768;
let resizerPosition = 50; // Porcentaje inicial para el divisor

const editorTab = document.getElementById('editor-tab');
const previewTab = document.getElementById('preview-tab');
const editorPanel = document.getElementById('editor-panel');
const previewPanel = document.getElementById('preview-panel');

const clearButton = document.getElementById('clear-button');
const uploadButton = document.getElementById('upload-button');
const fileUpload = document.getElementById('file-upload');
const exampleButton = document.getElementById('example-button');
const resizer = document.getElementById('resizer');
const sintaxModal = document.getElementById('sintax-modal');
const openModal = document.getElementById('open-modal');
const closeModal = document.querySelector('.close-modal');

const preview = document.getElementById('form-preview');
const elements = Array.from(preview.children);
const parserToJsonBtn = document.getElementById('toJsonBtn')
const renderFromJsonBtn = document.getElementById('fromJsonBtn')

// Ejemplo de Markdown
const markdownExample = `# Formulario de Contacto

## Información Personal

¿Cuál es tu nombre completo? @short
@desc Por favor, ingresa tu nombre y apellidos.

¿Cuál es tu correo electrónico? @short
@desc Usaremos este correo para contactarte.

¿Cuál es tu número de teléfono? @short

## Preferencias

¿Cómo prefieres que te contactemos? @single
- Correo electrónico
- Teléfono
- Mensaje de texto

¿Qué días de la semana estás disponible? @multi
- Lunes
- Martes
- Miércoles
- Jueves
- Viernes
- Sábado
- Domingo

¿Tienes algún comentario adicional? @long
@desc Cualquier información adicional que quieras compartir.

¿Puedes adjuntar tu CV? @file
@desc Archivos PDF o DOCX (máximo 5MB).`;

export function setupTabEvents() {
    setActiveTab('editor');
    editorTab.addEventListener('click', function() {
        setActiveTab('editor');
    });

    previewTab.addEventListener('click', function() {
        setActiveTab('preview');
        generatePreview();
    });
/*
    previewButton.addEventListener('click', function() {
        if (isMobile) {
            setActiveTab('preview');
        }
        generatePreview();
    });*/
}

function setActiveTab(tab) {
    currentTab = tab;

    // Solo cambia la visualización en móvil
    if (isMobile) {
        editorTab.classList.toggle('active', tab === 'editor');
        previewTab.classList.toggle('active', tab === 'preview');

        editorPanel.classList.toggle('active', tab === 'editor');
        previewPanel.classList.toggle('active', tab === 'preview');
    }
}

export function setupResizer() {
    let isResizing = false;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        resizer.classList.add('resizing');
        e.preventDefault();
    });

    // También añadimos soporte táctil para el resizer
    resizer.addEventListener('touchstart', function(e) {
        isResizing = true;
        resizer.classList.add('resizing');
        document.addEventListener('touchmove', handleTouchResize);
        document.addEventListener('touchend', stopResize);
        e.preventDefault();
    });

    function handleResize(e) {
        if (!isResizing) return;

        const container = document.querySelector('.split-view');
        const containerRect = container.getBoundingClientRect();

        // Calcular posición relativa
        const posX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        // Calcular porcentaje (con límites min/max)
        const minWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--min-panel-width'));
        const minPercent = (minWidth / containerWidth) * 100;
        const maxPercent = 100 - minPercent;

        let percent = (posX / containerWidth) * 100;
        percent = Math.min(Math.max(percent, minPercent), maxPercent);

        // Guardar la posición actual
        resizerPosition = percent;

        // Aplicar tamaños
        applyResizerPosition();
    }

    function handleTouchResize(e) {
        if (!isResizing || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const container = document.querySelector('.split-view');
        const containerRect = container.getBoundingClientRect();

        // Calcular posición relativa
        const posX = touch.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        // Calcular porcentaje (con límites min/max)
        const minWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--min-panel-width'));
        const minPercent = (minWidth / containerWidth) * 100;
        const maxPercent = 100 - minPercent;

        let percent = (posX / containerWidth) * 100;
        percent = Math.min(Math.max(percent, minPercent), maxPercent);

        // Guardar la posición actual
        resizerPosition = percent;

        // Aplicar tamaños
        applyResizerPosition();

        e.preventDefault();
    }

    function stopResize() {
        isResizing = false;
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('touchmove', handleTouchResize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
        resizer.classList.remove('resizing');
    }
}


function applyResizerPosition() {
    editorPanel.style.flex = `0 0 ${resizerPosition}%`;
    previewPanel.style.flex = `0 0 ${100 - resizerPosition}%`;
}

export function checkScreenSize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    // Si cambió el tipo de pantalla
    if (wasMobile !== isMobile) {
        if (isMobile) {
            // Cambiar a modo móvil
            setActiveTab(currentTab);
            editorPanel.style.flex = '';
            previewPanel.style.flex = '';
        } else {
            // Cambiar a modo escritorio
            editorPanel.classList.remove('active');
            previewPanel.classList.remove('active');
            applyResizerPosition();
        }
    }
}

export function setupButtonEvents(markdownEditor, formPreview) {
    clearButton.addEventListener('click', function() {
        markdownEditor.value = '';
        formPreview.innerHTML = '<div class="empty-message">Ingresa contenido Markdown en el editor para ver la vista previa</div>';
    });

    uploadButton.addEventListener('click', function(e) {
        e.preventDefault();
        fileUpload.click();
    });

    fileUpload.addEventListener('change', async function(e) {
        e.stopPropagation();

        const file = e.target.files[0];
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        let markdown = "";

        switch (ext) {
            case 'docx':
                markdown = await convertDocxToMarkdown(arrayBuffer);
                break;
            case 'pdf':
                markdown = await convertPdfToMarkdown(arrayBuffer);
                break;
            case 'txt':
                markdown = await convertTxtToMarkdown(arrayBuffer);
                break;
            case 'md':
                const reader = new FileReader();
                reader.onload = function(event) {
                    markdownEditor.value = event.target.result;
                    parseAndRender();
                };
                reader.readAsText(file);
                fileUpload.value = ''; // Reset inmediato para .md (asincrónico)
                return;
            default:
                // Podés mostrar un mensaje de error aquí si querés
                console.warn(`Extensión de archivo no soportada: ${ext}`);
                break;
        }

        markdownEditor.value = markdown;
        parseAndRender();

        // Reset el input para permitir cargar el mismo archivo otra vez
        fileUpload.value = '';
    });

    exampleButton.addEventListener('click', function() {
        markdownEditor.value = markdownExample;
    });
}


parserToJsonBtn.addEventListener('click', () => parseToJson(preview));
renderFromJsonBtn.addEventListener('click', () => {
    const json = {"formulario":{"elements":[{"index":0,"type":"section","title":"Formulario de Contacto"},{"index":1,"type":"section","title":"Información Personal"},{"index":2,"type":"question","text":"¿Cuál es tu nombre completo?","description":"Por favor, ingresa tu nombre y apellidos.","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":3,"type":"question","text":"¿Cuál es tu correo electrónico?","description":"Usaremos este correo para contactarte.","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":4,"type":"question","text":"¿Cuál es tu número de teléfono?","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":5,"type":"section","title":"Preferencias"},{"index":6,"type":"question","text":"¿Cómo prefieres que te contactemos?","response":{"type":"single","options":[{"id":"option-mq5y3gyiaut-0","text":"Correo electrónico"},{"id":"option-mq5y3gyiaut-1","text":"Teléfono"},{"id":"option-mq5y3gyiaut-2","text":"Mensaje de texto"}]}},{"index":8,"type":"question","text":"¿Qué días de la semana estás disponible?","response":{"type":"multi","options":[{"id":"option-t64va53p48q-0","text":"Lunes"},{"id":"option-t64va53p48q-1","text":"Martes"},{"id":"option-t64va53p48q-2","text":"Miércoles"},{"id":"option-t64va53p48q-3","text":"Jueves"},{"id":"option-t64va53p48q-4","text":"Viernes"},{"id":"option-t64va53p48q-5","text":"Sábado"},{"id":"option-t64va53p48q-6","text":"Domingo"}]}},{"index":10,"type":"question","text":"¿Tienes algún comentario adicional?","description":"Cualquier información adicional que quieras compartir.","response":{"type":"long","placeholder":"Ingresa tu respuesta aquí..."}},{"index":11,"type":"question","text":"¿Puedes adjuntar tu CV?","description":"Archivos PDF o DOCX (máximo 5MB).","response":{"type":"file","accept":[".pdf",".doc",".docx",".jpg",".jpeg",".png"]}}]}};
    
    const form =  renderFromJson(json);
    document.getElementById('markdown-editor').value = form;
    parseAndRender();
  });

// Load example
exampleButton.addEventListener('click', function() {
    document.getElementById('markdown-editor').value = markdownExample;
    parseAndRender();
});

// Clear form
clearButton.addEventListener('click', function() {
    markdownEditor.value = '';
    parsedContent = [];
    renderFormPreview();
});

// Modal handling
closeModal.addEventListener('click', function() {
    sintaxModal.style.display = 'none';
});
openModal.addEventListener('click', function() {
    sintaxModal.style.display = 'block';
});

window.addEventListener('click', function(event) {
    if (event.target === sintaxModal) {
        sintaxModal.style.display = 'none';
    }
});