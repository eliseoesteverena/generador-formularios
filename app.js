document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const editorTab = document.getElementById('editor-tab');
    const previewTab = document.getElementById('preview-tab');
    const editorPanel = document.getElementById('editor-panel');
    const previewPanel = document.getElementById('preview-panel');
    const markdownEditor = document.getElementById('markdown-editor');
    const formPreview = document.getElementById('form-preview');
   /* const previewButton = document.getElementById('preview-button');*/
    const clearButton = document.getElementById('clear-button');
    const uploadButton = document.getElementById('upload-button');
    const fileUpload = document.getElementById('file-upload');
    const exampleButton = document.getElementById('example-button');
    const resizer = document.getElementById('resizer');
    const sintaxModal = document.getElementById('sintax-modal');
    const openModal = document.getElementById('open-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Estado de la aplicación
    let currentTab = 'editor';
    let isMobile = window.innerWidth <= 768;
    let resizerPosition = 50; // Porcentaje inicial para el divisor

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

    // Inicialización
    init();

    function init() {
        // Configurar eventos de pestañas para móvil
        setupTabEvents();
        
        // Configurar el resizer para escritorio
        setupResizer();
        
        // Configurar otros botones
        setupButtonEvents();
        
        // Comprobar tamaño de pantalla inicial
        checkScreenSize();
        
        // Listener para cambios de tamaño de pantalla
        window.addEventListener('resize', checkScreenSize);
    }

    function setupTabEvents() {
        setActiveTab('editor');
        editorTab.addEventListener('click', function() {
            setActiveTab('editor');
        });
        
        previewTab.addEventListener('click', function() {
            setActiveTab('preview');
            generatePreview();
        });
        
       /* previewButton.addEventListener('click', function() {
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

    function setupResizer() {
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

    function checkScreenSize() {
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

    function setupButtonEvents() {
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

    // Real-time parsing and preview
    markdownEditor.addEventListener('input', function() {
        parseAndRender();
    });
    
    function parseAndRender() {
        const markdown = markdownEditor.value;
        parsedContent = parseMarkdown(markdown);
        renderFormPreview();
    }
    
    // Parse markdown to structured data
    function parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        const result = [];
        
        let currentList = [];
        let listType = null;
        let currentQuestion = "";
        let currentDescription = "";
        let currentResponseType = "short"; // Default response type
        let lastItemType = null;
        let lastItemIndex = -1;
        let waitingForOptions = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) {
                // If we were building a list, add it to the result
                if (currentList.length > 0) {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    listType = null;
                    currentQuestion = "";
                    currentDescription = "";
                }
                
                // If we were waiting for options but none came, add the question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                    waitingForOptions = false;
                    currentQuestion = "";
                    currentDescription = "";
                    currentResponseType = "short";
                }
                
                continue;
            }
            
            // Check for description lines
            if (line.startsWith('@desc')) {
                const description = line.substring(6).trim();
                
                // If the previous item was a question, add the description to it
                if (lastItemType === 'question' && lastItemIndex >= 0) {
                    result[lastItemIndex].description = description;
                }
                // If we're waiting for options or have a current question, store the description
                else if (waitingForOptions || currentQuestion) {
                    currentDescription = description;
                }
                continue;
            }
            
            // Check for headings
            if (line.startsWith('# ')) {
                // If we were building a list, add it to the result before adding the heading
                if (currentList.length > 0) {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    listType = null;
                    currentQuestion = "";
                    currentDescription = "";
                }
                
                // If we were waiting for options but none came, add the question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                    waitingForOptions = false;
                    currentQuestion = "";
                    currentDescription = "";
                    currentResponseType = "short";
                }
                
                result.push({
                    type: 'heading1',
                    content: line.substring(2)
                });
                lastItemType = 'heading1';
                lastItemIndex = result.length - 1;
                continue;
            }
            
            if (line.startsWith('## ')) {
                // If we were building a list, add it to the result before adding the heading
                if (currentList.length > 0) {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    listType = null;
                    currentQuestion = "";
                    currentDescription = "";
                }
                
                // If we were waiting for options but none came, add the question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                    waitingForOptions = false;
                    currentQuestion = "";
                    currentDescription = "";
                    currentResponseType = "short";
                }
                
                result.push({
                    type: 'heading2',
                    content: line.substring(3)
                });
                lastItemType = 'heading2';
                lastItemIndex = result.length - 1;
                continue;
            }
            
            if (line.startsWith('### ')) {
                // If we were building a list, add it to the result before adding the heading
                if (currentList.length > 0) {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    listType = null;
                    currentQuestion = "";
                    currentDescription = "";
                }
                
                // If we were waiting for options but none came, add the question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                    waitingForOptions = false;
                    currentQuestion = "";
                    currentDescription = "";
                    currentResponseType = "short";
                }
                
                result.push({
                    type: 'heading3',
                    content: line.substring(4)
                });
                lastItemType = 'heading3';
                lastItemIndex = result.length - 1;
                continue;
            }
            
            // Check for lists
            const bulletListMatch = line.match(/^[-*] (.+)/);
            const orderedListMatch = line.match(/^\d+\. (.+)/);
            
            if (bulletListMatch || orderedListMatch) {
                const content = bulletListMatch ? bulletListMatch[1] : orderedListMatch[1];
                
                // If we're waiting for options for a multiple choice or single choice question
                if (waitingForOptions && (currentResponseType === 'multi' || currentResponseType === 'single')) {
                    if (currentList.length === 0) {
                        // This is the first option, set the list type
                        listType = currentResponseType === 'multi' ? 'multipleChoice' : 'singleChoice';
                    }
                    
                    currentList.push(content);
                    continue;
                }
                
                // If we're not already building a list, start a new one
                if (currentList.length === 0 && !listType) {
                    listType = bulletListMatch ? 'bullet' : 'ordered';
                }
                
                currentList.push(content);
                continue;
            }
            
            // If we were building a list and this line is not a list item, add the list to the result
            if (currentList.length > 0) {
                addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                currentList = [];
                listType = null;
                currentQuestion = "";
                currentDescription = "";
                waitingForOptions = false;
                currentResponseType = "short";
            }
            
            // Check for questions with response type annotations
            const questionWithResponseType = line.match(/^(.+[?:])\s*@(\w+)$/);
            if (questionWithResponseType) {
                const questionText = questionWithResponseType[1].trim();
                const responseType = questionWithResponseType[2].toLowerCase();
                
                // If we were waiting for options but none came, add the previous question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                }
                
                // Set current question and response type
                currentQuestion = questionText;
                currentDescription = "";
                currentResponseType = responseType;
                
                // If this is a multi or single choice question, wait for options
                if (responseType === 'multi' || responseType === 'single') {
                    waitingForOptions = true;
                    continue;
                }
                
                // For other response types, add the question directly
                result.push({
                    type: 'question',
                    content: questionText,
                    id: generateId(),
                    description: "",
                    responseType: responseType
                });
                lastItemType = 'question';
                lastItemIndex = result.length - 1;
                waitingForOptions = false;
                currentQuestion = "";
                currentResponseType = "short";
                continue;
            }
            
            // Check for regular questions (without response type)
            if (
                (line.startsWith('¿') && line.endsWith('?')) ||
                (line.endsWith('?') && !line.endsWith('?M') && !line.endsWith('?O')) ||
                line.endsWith('?Q') ||
                line.endsWith(':')
            ) {
                // Remove the ?Q suffix if present
                let questionContent = line;
                if (line.endsWith('?Q')) {
                    questionContent = line.substring(0, line.length - 2) + '?';
                }
                
                // If we were waiting for options but none came, add the previous question as is
                if (waitingForOptions) {
                    result.push({
                        type: 'question',
                        content: currentQuestion,
                        id: generateId(),
                        description: currentDescription,
                        responseType: currentResponseType
                    });
                    waitingForOptions = false;
                }
                
                const questionItem = {
                    type: 'question',
                    content: questionContent,
                    id: generateId(),
                    description: '',
                    responseType: 'short' // Default response type
                };
                
                result.push(questionItem);
                lastItemType = 'question';
                lastItemIndex = result.length - 1;
                currentQuestion = "";
                currentDescription = "";
                currentResponseType = "short";
                continue;
            }
            
            // Default to paragraph
            result.push({
                type: 'paragraph',
                content: line
            });
            lastItemType = 'paragraph';
            lastItemIndex = result.length - 1;
        }
        
        // Add any remaining list
        if (currentList.length > 0) {
            addListToResult(result, currentList, listType, currentQuestion, currentDescription);
        }
        
        // If we were waiting for options but reached the end, add the question as is
        if (waitingForOptions) {
            result.push({
                type: 'question',
                content: currentQuestion,
                id: generateId(),
                description: currentDescription,
                responseType: currentResponseType
            });
        }
        
        return result;
    }
    
    // Helper function to add a list to the result array
    function addListToResult(result, list, type, question, description) {
        if (type === 'multipleChoice') {
            result.push({
                type: 'multipleChoice',
                question: question,
                options: list,
                id: generateId(),
                description: description
            });
        } else if (type === 'singleChoice') {
            result.push({
                type: 'singleChoice',
                question: question,
                options: list,
                id: generateId(),
                description: description
            });
        } else if (type === 'bullet') {
            result.push({
                type: 'list',
                items: list
            });
        } else if (type === 'ordered') {
            result.push({
                type: 'orderedList',
                items: list
            });
        }
    }
    
    // Generate a unique ID
    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
    
    // Generate markdown from parsed content
    function generateMarkdown(content) {
        let markdown = '';
        
        content.forEach((item, index) => {
            // Add a newline between items
            if (index > 0) {
                markdown += '\n\n';
            }
            
            switch (item.type) {
                case 'heading1':
                    markdown += `# ${item.content}`;
                    break;
                    
                case 'heading2':
                    markdown += `## ${item.content}`;
                    break;
                    
                case 'heading3':
                    markdown += `### ${item.content}`;
                    break;
                    
                case 'paragraph':
                    markdown += item.content;
                    break;
                    
                case 'question':
                    // Only add the response type annotation if it's not the default 'short'
                    if (item.responseType && item.responseType !== 'short') {
                        markdown += `${item.content} @${item.responseType}`;
                    } else {
                        markdown += item.content;
                    }
                    
                    if (item.description) {
                        markdown += `\n@desc ${item.description}`;
                    }
                    break;
                    
                case 'multipleChoice':
                    markdown += `${item.question} @multi`;
                    if (item.description) {
                        markdown += `\n@desc ${item.description}`;
                    }
                    item.options.forEach(option => {
                        markdown += `\n- ${option}`;
                    });
                    break;
                    
                case 'singleChoice':
                    markdown += `${item.question} @single`;
                    if (item.description) {
                        markdown += `\n@desc ${item.description}`;
                    }
                    item.options.forEach(option => {
                        markdown += `\n- ${option}`;
                    });
                    break;
                    
                case 'list':
                    item.items.forEach(listItem => {
                        markdown += `\n- ${listItem}`;
                    });
                    break;
                    
                case 'orderedList':
                    item.items.forEach((listItem, idx) => {
                        markdown += `\n${idx + 1}. ${listItem}`;
                    });
                    break;
            }
        });
        
        return markdown;
    }
    
    // Render form preview
    function renderFormPreview() {
        if (parsedContent.length === 0) {
            formPreview.innerHTML = '<div class="empty-message">Ingresa contenido Markdown en el editor para ver la vista previa</div>';
            return;
        }
        
        formPreview.innerHTML = '';
        
        parsedContent.forEach((item, index) => {
            const element = createFormElement(item, index);
            if (element) {
                formPreview.appendChild(element);
            }
        });
    }
    
    // Create form elements based on parsed content
    function createFormElement(item, index) {
        const element = document.createElement('div');
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        element.className = 'form-element';
        element.dataset.index = index;
        switch (item.type) {
            case 'heading1':
                if(index == 0){
                    element.innerHTML = `<h1 class="heading1" id="heading1">${item.content}</h1>`;
                } else {
                    element.innerHTML = `<h1 class="heading1">${item.content}</h1>`;
                }
                
                break;
                
            case 'heading2':
                element.innerHTML = `<h2 class="heading2">${item.content}</h2>`;
                break;
                
            case 'heading3':
                element.innerHTML = `<h3 class="heading3">${item.content}</h3>`;
                break;
                
            case 'paragraph':
                element.innerHTML = `<p class="paragraph">${item.content}</p>`;
                break;
                
            case 'question':
                if(item.responseType === 'multi' || item.responseType === 'single'){
                    break;
                }
               element.className = 'question-container';

                let questionHtml = `
                    <div class="question-actions">
                        <!--button class="button button-icon edit-description" data-index="${index}">✏️</button-->
                        <button class="button button-icon delete-question" data-index="${index}" type="button" aria-label="Eliminar">🗑️</button>
                    </div>
                    <fieldset aria-labelledby="${index}-legend">
                        <legend class="question-text" id="${index}-legend">${item.content}</legend>
                `;
                
                // Add description if it exists
                if (item.description) {
                    if(item.description.length >= 50) {
                        questionHtml += `<div class="question-description" role="region" aria-describedby="${index}-desc">${item.description}</div>`;
                    } else {
                        questionHtml += `<div class="question-description" aria-describedby="${index}-desc">${item.description}</div>`;
                    }
                }
                
                // Render different input types based on responseType
                questionHtml += `<div class="answer-field">`;
                
                switch (item.responseType) {
                    case 'long':
                        questionHtml += `<label for="long-${item.id}" class="visually-hidden">${item.content}</label><textarea placeholder="Ingresa tu respuesta aquí..." class="long-answer" id="long-${item.id}" aria-describedby="${index}-desc"></textarea>`;
                        break;
                        
                    case 'file':
                        questionHtml += `
                            <div class="file-upload-container">
                                <input type="file" id="file-${item.id}" class="file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" aria-describedby="${index}-desc">
                                <label for="file-${item.id}" class="file-label">
                                    <span class="file-icon">📎</span>
                                    <span class="file-text">Elegir un archivo</span>
                                </label>
                                <div class="file-info">Ningún archivo seleccionado</div>
                            </div>
                        `;
                        break;
                        
                    default: // 'short' is the default
                        questionHtml += `<label for="short-${item.id}" class="visually-hidden">${item.content}</label><input type="text" placeholder="Ingresa tu respuesta aquí..." class="short-answer" id="short-${item.id}" aria-describedby="${index}-desc">`;
                        break;
                }
                
                questionHtml += `</fieldset>`;
                
                // Only show response type selector for text inputs (not for file uploads)
                /*
                    if (item.responseType !== 'file') {
                        questionHtml += `
                            <div class="response-type-selector">
                                <label>Tipo de respuesta:</label>
                                <select class="response-type-dropdown" data-index="${index}">
                                    <option value="short" ${item.responseType === 'short' ? 'selected' : ''}>Texto corto</option>
                                    <option value="long" ${item.responseType === 'long' ? 'selected' : ''}>Texto largo</option>
                                    <option value="multi" ${item.responseType === 'multi' ? 'selected' : ''}>Opción múltiple</option>
                                    <option value="single" ${item.responseType === 'single' ? 'selected' : ''}>Opción única</option>
                                    <option value="file" ${item.responseType === 'file' ? 'selected' : ''}>Subida de archivo</option>
                                </select>
                            </div>
                        `;
                    }
                    */
                
                element.innerHTML = questionHtml;
                
                // Add event listener for file inputs
                if (item.responseType === 'file') {
                    setTimeout(() => {
                        const fileInput = element.querySelector('.file-input');
                        const fileInfo = element.querySelector('.file-info');
                        
                        if (fileInput && fileInfo) {
                            fileInput.addEventListener('change', function() {
                                if (this.files && this.files.length > 0) {
                                    fileInfo.textContent = this.files[0].name;
                                } else {
                                    fileInfo.textContent = 'Ningún archivo seleccionado';
                                }
                            });
                        }
                    }, 0);
                }
                break;
                
            case 'multipleChoice':
                element.className = 'question-container';
                
                let multipleChoiceHtml = `
                    <div class="question-actions">
                        <!--button class="button button-icon edit-description" data-index="${index}">✏️</button-->
                        <button class="button button-icon delete-question" data-index="${index}" type="button" aria-label="Eliminar">🗑️</button>
                    </div>
                    <fieldset aria-labelledby="${index}-legend">
                        <legend class="question-text" id="${index}-legend">${item.question}</legend>
                `;
                
                // Add description if it exists
                if (item.description) {
                    multipleChoiceHtml += `<div class="question-description" aria-describedby="${index}-desc">${item.description}</div>`;
                }
                
                multipleChoiceHtml += `<div class="options-container">`;
                
                item.options.forEach((option, optionIndex) => {
                    multipleChoiceHtml += `
                        <div class="checkbox-container">
                            <input type="checkbox" id="option-${item.id}-${optionIndex}" class="custom-checkbox">
                            <label for="option-${item.id}-${optionIndex}">${option}</label>
                        </div>
                    `;
                });
                
                multipleChoiceHtml += `</fieldset>`;
                element.innerHTML = multipleChoiceHtml;
                break;
                
            case 'singleChoice':
                element.className = 'question-container';
                
                let singleChoiceHtml = `
                    <div class="question-actions">
                        <!--button class="button button-icon edit-description" data-index="${index}">✏️</button -->
                        <button class="button button-icon delete-question" data-index="${index}" type="button" aria-label="Eliminar">🗑️</button>
                    </div>
                    <fieldset aria-labelledby="${index}-legend">
                        <legend class="question-text" id="${index}-legend">${item.question}</legend>
                `;
                
                // Add description if it exists
                if (item.description) {
                    singleChoiceHtml += `<div class="question-description" aria-describedby="${index}-desc">${item.description}</div>`;
                }
                
                singleChoiceHtml += `<div class="options-container">`;
                
                item.options.forEach((option, optionIndex) => {
                    singleChoiceHtml += `
                        <div class="radio-container">
                            <input type="radio" name="radio-group-${item.id}" id="option-${item.id}-${optionIndex}" class="custom-radio">
                            <label for="option-${item.id}-${optionIndex}">${option}</label>
                        </div>
                    `;
                });
                
                singleChoiceHtml += `</fieldset>`;
                element.innerHTML = singleChoiceHtml;
                break;
                
            case 'list':
                const listElement = document.createElement('ul');
                listElement.className = 'list';
                
                item.items.forEach(listItem => {
                    const li = document.createElement('li');
                    li.textContent = listItem;
                    listElement.appendChild(li);
                });
                
                element.appendChild(listElement);
                break;
                
            case 'orderedList':
                const orderedListElement = document.createElement('ol');
                orderedListElement.className = 'ordered-list';
                
                item.items.forEach(listItem => {
                    const li = document.createElement('li');
                    li.textContent = listItem;
                    orderedListElement.appendChild(li);
                });
                
                element.appendChild(orderedListElement);
                break;
                
            default:
                return null;
        }
        
        return element;
    }
    

    
    // Load example
    exampleButton.addEventListener('click', function() {
        markdownEditor.value = markdownExample;
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
    
    // Event delegation for dynamic elements
    formPreview.addEventListener('click', function(e) {
        // Edit description button
        if (e.target.classList.contains('edit-description') || e.target.parentElement.classList.contains('edit-description')) {
            const index = parseInt(e.target.closest('[data-index]').dataset.index);
            currentEditingElement = parsedContent[index];
            
            // Set current description in the textarea
            if (currentEditingElement.type === 'question') {
                descriptionTextarea.value = currentEditingElement.description || '';
            } else if (currentEditingElement.type === 'multipleChoice' || currentEditingElement.type === 'singleChoice') {
                descriptionTextarea.value = currentEditingElement.description || '';
            }
            
            // Show modal
            sintaxModal.style.display = 'block';
        }
        
        // Delete question button
        if (e.target.classList.contains('delete-question') || e.target.parentElement.classList.contains('delete-question')) {
            const index = parseInt(e.target.closest('[data-index]').dataset.index);
            parsedContent.splice(index, 1);
            
            // Update markdown and re-render
            markdownEditor.value = generateMarkdown(parsedContent);
            renderFormPreview();
        }
        
        // Toggle answer type
        if (e.target.classList.contains('toggle-answer')) {
            const index = parseInt(e.target.dataset.index);
            parsedContent[index].longAnswer = e.target.checked;
            
            // Update markdown and re-render
            markdownEditor.value = generateMarkdown(parsedContent);
            renderFormPreview();
        }
    });
    
    // Event delegation for response type dropdown
    formPreview.addEventListener('change', function(e) {
        // Response type dropdown
        if (e.target.classList.contains('response-type-dropdown')) {
            const index = parseInt(e.target.dataset.index);
            const newResponseType = e.target.value;
            
            // Update the response type
            parsedContent[index].responseType = newResponseType;
            
            // Update markdown and re-render
            markdownEditor.value = generateMarkdown(parsedContent);
            renderFormPreview();
        }
        
        // File input change
        if (e.target.classList.contains('file-input')) {
            const fileInfo = e.target.parentElement.querySelector('.file-info');
            if (e.target.files && e.target.files.length > 0) {
                fileInfo.textContent = e.target.files[0].name;
            } else {
                fileInfo.textContent = 'Ningún archivo seleccionado';
            }
        }
    });
    
  // Save description
    closeModal.addEventListener('click', function() {
        sintaxModal.style.display = 'none';
    });
    
    // Initialize with example content
    parseAndRender();
});