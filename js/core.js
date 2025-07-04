import { el, mount } from './mount.js';
let parsedContent = [];
export { parsedContent };
const markdownEditor = document.getElementById('markdown-editor');
export { markdownEditor }
const formPreview = document.getElementById('form-preview');

// Real-time parsing and preview
markdownEditor.addEventListener('input', function() {
    parseAndRender();
});

export function parseAndRender() {
    const markdown = markdownEditor.value;
    parsedContent = parseMarkdown(markdown);
    renderFormPreview(parsedContent);
}

// Parse markdown to structured data
export function parseMarkdown(markdown) {
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
        if (!line || !line === "@short" || !line === "@multi" || !line === "@single") {
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

// Helper export function to add a list to the result array
export function addListToResult(result, list, type, question, description) {
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
export function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// Generate markdown from parsed content
export function generateMarkdown(content) {
    let markdown = '';

    content = purgeParsedContent(content);

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
export function renderFormPreview(parsedContent) {
navigator.clipboard.writeText(JSON.stringify(parsedContent))
    if (parsedContent.length === 0) {
        //formPreview.innerHTML = '<div class="empty-message">Ingresa contenido Markdown en el editor para ver la vista previa</div>';
        formPreview.appendChild(el('div.empty-message', {textContent: 'Ingresa contenido Markdown en el editor para ver la vista previa'}));
        return;
    }

    formPreview.innerHTML = '';
    
    parsedContent = purgeParsedContent(parsedContent);

    parsedContent.forEach((item, index) => {
      const element = createFormElement(item, index);
      if (element) {
        formPreview.appendChild(element);
      }
    });

}

export function purgeParsedContent(contentArray) {
    return contentArray.filter(item => {
      const shouldRemove = (
        item.content === "@single" ||
        (item.content === "@multi" && item.type === "paragraph")
      );
      return !shouldRemove; // Retornamos 'true' para mantener el elemento.
    });
  }

// Create form elements based on parsed content

export function createFormElement(item, index) {
   
    const element = el('div');
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    element.className = 'form-element';
    element.dataset.index = index;
    /*
    switch (item.type) {
        case 'heading1':
            if (index == 0) {
                element.innerHTML = `<h1 class="heading1" id="heading1" contenteditable="true">${item.content}</h1>`;
            } else {
                element.innerHTML = `<h1 class="heading1" contenteditable="true">${item.content}</h1>`;
            }

            break;

        case 'heading2':
            element.innerHTML = `<h2 class="heading2" contenteditable="true">${item.content}</h2>`;
            break;

        case 'heading3':
            element.innerHTML = `<h3 class="heading3" contenteditable="true">${item.content}</h3>`;
            break;

        case 'paragraph':
            element.innerHTML = `<p class="paragraph" contenteditable="true">${item.content}</p>`;
            break;

        case 'question':
            if (item.responseType === 'multi' || item.responseType === 'single') {
                break;
            }
            element.className = 'question-container';

            let questionHtml = `
                <div class="question-actions">
                    <!--button class="button button-icon edit-description" data-index="${index}">✏️</button-->
                    <button class="button button-icon delete-question" data-index="${index}" type="button" aria-label="Eliminar">🗑️</button>
                </div>
                <fieldset aria-labelledby="${index}-legend">
                    <legend class="question-text" id="${index}-legend" contenteditable="true" tabindex="0">${item.content}</legend>
            `;

            // Add description if it exists
            if (item.description) {
                if (item.description.length >= 50) {
                    questionHtml += `<p class="question-description" role="region" aria-describedby="${index}-desc" contenteditable="true">${item.description}</p>`;
                } else {
                    questionHtml += `<p class="question-description" aria-describedby="${index}-desc" contenteditable="true">${item.description}</p>`;
                }
            }

            // Render different input types based on responseType
            questionHtml += `<div class="answer-field">`;

            switch (item.responseType) {
                case 'long':
                    questionHtml += `<label for="long-${item.id}" class="visually-hidden" contenteditable="true">${item.content}</label><textarea placeholder="Ingresa tu respuesta aquí..." class="long-answer" id="long-${item.id}" aria-describedby="${index}-desc"></textarea>`;
                    break;

                case 'file':
                    questionHtml += `
                        <div class="file-upload-container">
                            <input type="file" id="file-${item.id}" class="file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" aria-describedby="${index}-desc" contenteditable="false">
                            <label for="file-${item.id}" class="file-label">
                                <span class="file-icon">📎</span>
                                <span class="file-text">Elegir un archivo</span>
                            </label>
                            <div class="file-info">Ningún archivo seleccionado</div>
                        </div>
                    `;
                    break;

                default: // 'short' is the default
                    questionHtml += `<label for="short-${item.id}" class="visually-hidden" contenteditable="true">${item.content}</label><input type="text" placeholder="Ingresa tu respuesta aquí..." class="short-answer" id="short-${item.id}" aria-describedby="${index}-desc" contenteditable="false">`;
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
/*
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
                    <legend class="question-text" id="${index}-legend" contenteditable="true" tabindex="0">${item.question}</legend>
            `;

            // Add description if it exists
            if (item.description) {
                multipleChoiceHtml += `<p class="question-description" aria-describedby="${index}-desc">${item.description}</p>`;
            }

            multipleChoiceHtml += `<div class="options-container">`;

            item.options.forEach((option, optionIndex) => {
                multipleChoiceHtml += `
                    <div class="checkbox-container">
                        <input type="checkbox" id="option-${item.id}-${optionIndex}" class="custom-checkbox" contenteditable="false">
                        <label for="option-${item.id}-${optionIndex}" contenteditable="true">${option}</label>
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
                    <legend class="question-text" id="${index}-legend" contenteditable="true" tabindex="0">${item.question}</legend>
            `;

            // Add description if it exists
            if (item.description) {
                singleChoiceHtml += `<p class="question-description" aria-describedby="${index}-desc" contenteditable="true">${item.description}</p>`;
            }

            singleChoiceHtml += `<div class="options-container">`;

            item.options.forEach((option, optionIndex) => {
                singleChoiceHtml += `
                    <div class="radio-container">
                        <input type="radio" name="radio-group-${item.id}" id="option-${item.id}-${optionIndex}" class="custom-radio" contenteditable="false">
                        <label for="option-${item.id}-${optionIndex}" contenteditable="true">${option}</label>
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
*/
switch (item.type) {
    case 'heading1':
        const h1Element = el('h1.heading1', {
            id: index === 0 ? 'heading1' : undefined,
            
        }, item.content);
        element.appendChild(h1Element);
        break;

    case 'heading2':
        const h2Element = el('h2.heading2', {
            
        }, item.content);
        element.appendChild(h2Element);
        break;

    case 'heading3':
        const h3Element = el('h3.heading3', {
            
        }, item.content);
        element.appendChild(h3Element);
        break;

    case 'paragraph':
        const pElement = el('p.paragraph', {
            
        }, item.content);
        element.appendChild(pElement);
        break;

    case 'question':
        if (item.responseType === 'multi' || item.responseType === 'single') {
            break;
        }
        element.className = 'question-container';

        // Create question actions
        const questionActions = el('div.question-actions', {}, [
            el('button.button.button-icon.delete-question', {
                'data-index': index,
                type: 'button',
                'aria-label': 'Eliminar'
            }, '🗑️')
        ]);

        // Create legend
        const legend = el('legend.question-text', {
            id: `${index}-legend`,
    
            tabindex: '0'
        }, item.content);

        // Create description if exists
        const descriptionElement = item.description ? 
            el('p.question-description', {
                role: item.description.length >= 50 ? 'region' : undefined,
                'aria-describedby': `${index}-desc`,
                
            }, item.description) : null;

        // Create answer field based on response type
        let answerField;
        switch (item.responseType) {
            case 'long':
                answerField = el('div.answer-field', {}, [
                    el('label.visually-hidden', {
                        for: `long-${item.id}`,
                        
                    }, item.content),
                    el('textarea.long-answer', {
                        placeholder: 'Ingresa tu respuesta aquí...',
                        id: `long-${item.id}`,
                        'aria-describedby': `${index}-desc`
                    })
                ]);
                break;

            case 'file':
                answerField = el('div.answer-field', {}, [
                    el('div.file-upload-container', {}, [
                        el('input.file-input', {
                            type: 'file',
                            id: `file-${item.id}`,
                            accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
                            'aria-describedby': `${index}-desc`,
                            contenteditable: 'false'
                        }),
                        el('label.file-label', {
                            for: `file-${item.id}`
                        }, [
                            el('span.file-icon', {}, '📎'),
                            el('span.file-text', {}, 'Elegir un archivo')
                        ]),
                        el('div.file-info', {}, 'Ningún archivo seleccionado')
                    ])
                ]);
                break;

            default: // 'short' is the default
                answerField = el('div.answer-field', {}, [
                    el('label.visually-hidden', {
                        for: `short-${item.id}`,
                        
                    }, item.content),
                    el('input.short-answer', {
                        type: 'text',
                        placeholder: 'Ingresa tu respuesta aquí...',
                        id: `short-${item.id}`,
                        'aria-describedby': `${index}-desc`,
                        contenteditable: 'false'
                    })
                ]);
                break;
        }

        // Create fieldset with all children
        const fieldsetChildren = [legend];
        if (descriptionElement) {
            fieldsetChildren.push(descriptionElement);
        }
        fieldsetChildren.push(answerField);

        const fieldset = el('fieldset', {
            'aria-labelledby': `${index}-legend`
        }, fieldsetChildren);

        // Append everything to element
        element.appendChild(questionActions);
        element.appendChild(fieldset);

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

        // Create question actions
        const multipleActions = el('div.question-actions', {}, [
            el('button.button.button-icon.delete-question', {
                'data-index': index,
                type: 'button',
                'aria-label': 'Eliminar'
            }, '🗑️')
        ]);

        // Create legend
        const multipleLegend = el('legend.question-text', {
            id: `${index}-legend`,
    
            tabindex: '0'
        }, item.question);

        // Create description if exists
        const multipleDescription = item.description ? 
            el('p.question-description', {
                'aria-describedby': `${index}-desc`
            }, item.description) : null;

        // Create options
        const optionsContainer = el('div.options-container', {}, 
            item.options.map((option, optionIndex) => 
                el('div.checkbox-container', {}, [
                    el('input.custom-checkbox', {
                        type: 'checkbox',
                        id: `option-${item.id}-${optionIndex}`,
                        contenteditable: 'false'
                    }),
                    el('label', {
                        for: `option-${item.id}-${optionIndex}`,
                        
                    }, option)
                ])
            )
        );

        // Create fieldset with all children
        const multipleFieldsetChildren = [multipleLegend];
        if (multipleDescription) {
            multipleFieldsetChildren.push(multipleDescription);
        }
        multipleFieldsetChildren.push(optionsContainer);

        const multipleFieldset = el('fieldset', {
            'aria-labelledby': `${index}-legend`
        }, multipleFieldsetChildren);

        // Append everything to element
        element.appendChild(multipleActions);
        element.appendChild(multipleFieldset);
        break;

    case 'singleChoice':
        element.className = 'question-container';

        // Create question actions
        const singleActions = el('div.question-actions', {}, [
            el('button.button.button-icon.delete-question', {
                'data-index': index,
                type: 'button',
                'aria-label': 'Eliminar'
            }, '🗑️')
        ]);

        // Create legend
        const singleLegend = el('legend.question-text', {
            id: `${index}-legend`,
    
            tabindex: '0'
        }, item.question);

        // Create description if exists
        const singleDescription = item.description ? 
            el('p.question-description', {
                'aria-describedby': `${index}-desc`,
                
            }, item.description) : null;

        // Create options
        const singleOptionsContainer = el('div.options-container', {}, 
            item.options.map((option, optionIndex) => 
                el('div.radio-container', {}, [
                    el('input.custom-radio', {
                        type: 'radio',
                        name: `radio-group-${item.id}`,
                        id: `option-${item.id}-${optionIndex}`,
                        contenteditable: 'false'
                    }),
                    el('label', {
                        for: `option-${item.id}-${optionIndex}`,
                        
                    }, option)
                ])
            )
        );

        // Create fieldset with all children
        const singleFieldsetChildren = [singleLegend];
        if (singleDescription) {
            singleFieldsetChildren.push(singleDescription);
        }
        singleFieldsetChildren.push(singleOptionsContainer);

        const singleFieldset = el('fieldset', {
            'aria-labelledby': `${index}-legend`
        }, singleFieldsetChildren);

        // Append everything to element
        element.appendChild(singleActions);
        element.appendChild(singleFieldset);
        break;

    case 'list':
        const listElement = el('ul.list', {}, 
            item.items.map(listItem => 
                el('li', {}, listItem)
            )
        );
        element.appendChild(listElement);
        break;

    case 'orderedList':
        const orderedListElement = el('ol.ordered-list', {}, 
            item.items.map(listItem => 
                el('li', {}, listItem)
            )
        );
        element.appendChild(orderedListElement);
        break;

    default:
        return null;
}
    return element;
}

function purgedWords(content, wordsToDelete) {
    const setOfWords = new Set(wordsToDelete);
    
    const lines = content.split('\n');
    const linesFilters = lines.filter(line => !setOfWords.has(line.trim()));
    
    let txt = linesFilters.join('\n');
    console.log(txt)
    return linesFilters.join('\n');
  }

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
        renderFormPreview(parsedContent);
    }

    // Toggle answer type
    if (e.target.classList.contains('toggle-answer')) {
        const index = parseInt(e.target.dataset.index);
        parsedContent[index].longAnswer = e.target.checked;

        // Update markdown and re-render
        markdownEditor.value = generateMarkdown(parsedContent);
        renderFormPreview(parsedContent);
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
        renderFormPreview(parsedContent);
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