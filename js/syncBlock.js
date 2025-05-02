import { parsedContent, markdownEditor, generateMarkdown, purgeParsedContent } from './core.js';

export function syncBlock(index, field, newValue) {
    if (!parsedContent[index]) {
      console.error(`syncBlock: No se encontró un bloque en index ${index}`);
      return;
    }
  
    // Validación básica
    if (field === 'options' && !Array.isArray(newValue)) {
      console.error('syncBlock: El campo options debe ser un array');
      return;
    }
  
    // Actualizar valor
    parsedContent[index][field] = newValue;
  
    // Opcional: puedes también "marcar" que el bloque fue modificado si quieres gestionar cambios pendientes
    parsedContent[index].modified = true; 
    
    

    // Recompilar markdown y actualizar editor oculto
    const markdown = generateMarkdown(parsedContent);
    //const markdownEditor = document.getElementById('markdown-editor');
    if (markdownEditor) {
      markdownEditor.value = markdown;
    }
  }

  export function setupWysiwygObserver() {
    const formPreview = document.getElementById('form-preview');
  
    formPreview.addEventListener('input', event => {
      const target = event.target;
      const container = target.closest('[data-index]');
      if (!container) return;
  
      const index = parseInt(container.dataset.index, 10);
  
      if (target.matches('legend')) {
        syncBlock(index, 'content', target.textContent.trim());
      } else if (target.matches('h2, h3')) {
        syncBlock(index, 'content', target.textContent.trim());
      } else if (target.matches('label')) {
        const labels = container.querySelectorAll('label');
        const optionIndex = Array.from(labels).indexOf(target);
        if (optionIndex !== -1 && parsedContent[index] && parsedContent[index].options) {
          parsedContent[index].options[optionIndex] = target.textContent.trim();
          syncBlock(index, 'options', parsedContent[index].options);
        }


      } else if (target.matches('p.question-description')) {
        syncBlock(index, 'description', target.textContent.trim());
      }
    });
  }
