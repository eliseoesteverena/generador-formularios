const preview = document.getElementById('form-preview');
const elements = Array.from(preview.children);
const saveFormBtn = document.getElementById('enviar')

/*
saveFormBtn.addEventListener("click", () => {
    // 1) Recalcula aquí
    const elements = Array.from(preview.children);

    const json = { formulario: { elements: [] } };

    elements.forEach(el => {
        const idx = parseInt(el.dataset.index, 10);

        // SECCIONES: h1 o h2
        if (el.matches('.form-element')) {
            const title = el.querySelector('h2, h1')?.textContent;
            if (title) {
                json.formulario.elements.push({
                    index: idx,
                    type: 'section',
                    title
                });
            }
        }
        // PREGUNTAS
        else if (el.matches('.question-container')) {
            const text = el.querySelector('.question-text').textContent;
            const descEl = el.querySelector('.question-description');
            const description = descEl ? descEl.textContent : undefined;

            // detectar tipo de campo
            let response = {};
            if (el.querySelector('input[type="file"]')) {
                response.type = 'file';
                response.accept = el.querySelector('input[type="file"]')
                                 .accept.split(',');
            } else if (el.querySelector('.custom-radio')) {
                response.type = 'single';
                response.options = Array.from(el.querySelectorAll('.radio-container'))
                    .map(rc => ({
                        id: rc.querySelector('input').id,
                        text: rc.querySelector('label').textContent
                    }));
            } else if (el.querySelector('.custom-checkbox')) {
                response.type = 'multi';
                response.options = Array.from(el.querySelectorAll('.checkbox-container'))
                    .map(cc => ({
                        id: cc.querySelector('input').id,
                        text: cc.querySelector('label').textContent
                    }));
            } else if (el.querySelector('textarea')) {
                response.type = 'long';
                response.placeholder = el.querySelector('textarea').placeholder;
            } else {
                response.type = 'short';
                response.placeholder = el.querySelector('input').placeholder;
            }

            const q = { index: idx, type: 'question', text };
            if (description) q.description = description;
            q.response = response;

            json.formulario.elements.push(q);
        }
    });

    // 2) Imprime aquí, afuera del forEach
    console.log(JSON.stringify(json));
});
*/
/**
 * Dado un JSON de formulario en la forma:
 * {
 *   formulario: {
 *     elements: [ { index, type, text, description?, response: { type, placeholder?, options?, accept? } }, … ]
 *   }
 * }
 * Genera un bloque de texto con la sintaxis definida.
 */
function jsonToMarkdown(formJson) {
    const elements = formJson.formulario.elements;
    let lines = [];
  
    elements.forEach(el => {
      switch (el.type) {
        case 'heading1':
        case 'section':
          // heading1 deberá mapear a "#", heading2 (sección interna) a "##"
          // Si tu JSON usa 'section' y no distingue nivel, ajustar según tu caso:
          const prefix = (el.type === 'heading1' || el.index === 0) ? '# ' : '## ';
          lines.push(prefix + el.title);
          lines.push('');  // Línea en blanco
          break;
  
        case 'question':
          // La pregunta y el sufijo según response.type
          const respType = el.response.type;
          lines.push(el.text + ' @' + respType);
  
          // Descripción
          if (el.description) {
            lines.push('@desc ' + el.description);
          }
  
          // Opciones para single / multi
          if (respType === 'single' || respType === 'multi') {
            el.response.options.forEach(opt => {
              lines.push('- ' + opt.text);
            });
          }
  
          // En el caso de file, no hay lista
          lines.push('');
          break;
      }
    });
  
    // Unir en un único texto
    return lines.join('\n');
  }
  
  // Ejemplo de uso:
  const editor = document.getElementById('markdown-editor');
  const saveJsonBtn = document.getElementById('load-json');
  
  saveFormBtn.addEventListener('click', () => {
    // Supón que tienes tu JSON en una variable `formJson`
    // p.ej. lo obtienes leyendo un input oculto, o desde tu base de datos:
    const formJson = {"formulario":{"elements":[{"index":0,"type":"section","title":"Formulario de Contacto"},{"index":1,"type":"section","title":"Información Personal"},{"index":2,"type":"question","text":"¿Cuál es tu nombre completo?","description":"Por favor, ingresa tu nombre y apellidos.","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":3,"type":"question","text":"¿Cuál es tu correo electrónico?","description":"Usaremos este correo para contactarte.","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":4,"type":"question","text":"¿Cuál es tu número de teléfono?","response":{"type":"short","placeholder":"Ingresa tu respuesta aquí..."}},{"index":5,"type":"section","title":"Preferencias"},{"index":6,"type":"question","text":"¿Cómo prefieres que te contactemos?","response":{"type":"single","options":[{"id":"option-mq5y3gyiaut-0","text":"Correo electrónico"},{"id":"option-mq5y3gyiaut-1","text":"Teléfono"},{"id":"option-mq5y3gyiaut-2","text":"Mensaje de texto"}]}},{"index":8,"type":"question","text":"¿Qué días de la semana estás disponible?","response":{"type":"multi","options":[{"id":"option-t64va53p48q-0","text":"Lunes"},{"id":"option-t64va53p48q-1","text":"Martes"},{"id":"option-t64va53p48q-2","text":"Miércoles"},{"id":"option-t64va53p48q-3","text":"Jueves"},{"id":"option-t64va53p48q-4","text":"Viernes"},{"id":"option-t64va53p48q-5","text":"Sábado"},{"id":"option-t64va53p48q-6","text":"Domingo"}]}},{"index":10,"type":"question","text":"¿Tienes algún comentario adicional?","description":"Cualquier información adicional que quieras compartir.","response":{"type":"long","placeholder":"Ingresa tu respuesta aquí..."}},{"index":11,"type":"question","text":"¿Puedes adjuntar tu CV?","description":"Archivos PDF o DOCX (máximo 5MB).","response":{"type":"file","accept":[".pdf",".doc",".docx",".jpg",".jpeg",".png"]}}]}};
    
    const markdown = jsonToMarkdown(formJson);
    editor.value = markdown;
  });
  