export function parseToJson(preview) {
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
  }
  
export function renderFromJson(json) {
    const elements = json.formulario.elements;
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