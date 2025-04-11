// Función para quitar formato HTML y convertir a texto plano Markdown
function unformatText(html) {
  // Eliminar etiquetas HTML y convertir a texto plano
  let text = html;
  
  // Reemplazar etiquetas <strong> con **
  text = text.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
  
  // Reemplazar etiquetas <em> con *
  text = text.replace(/<em>(.*?)<\/em>/g, "*$1*");
  
  // Reemplazar etiquetas <strong><em> con ***
  text = text.replace(/<strong><em>(.*?)<\/em><\/strong>/g, "***$1***");
  
  // Reemplazar enlaces
  text = text.replace(/<a href="(.*?)".*?>(.*?)<\/a>/g, "[$2]($1)");
  
  return text;
}

// Función para generar Markdown a partir de elementos de formulario
function generateMarkdown(elements) {
  let markdown = "";

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const nextElement = i < elements.length - 1 ? elements[i + 1] : null;

    switch (element.type) {
      case "title":
        markdown += `# ${element.content}\n\n`;
        break;

      case "section":
        markdown += `## ${element.content}\n\n`;
        break;

      case "subsection":
        markdown += `### ${element.content}\n\n`;
        break;

      case "paragraph":
        markdown += `${unformatText(element.content)}\n\n`;
        break;

      case "blockquote":
        markdown += `> ${unformatText(element.content)}\n\n`;
        break;

      case "list":
        // Omitir si esta lista es parte de un par pregunta-lista que será manejado por la pregunta
        if (i > 0 && elements[i - 1].type === "question") {
          continue;
        }

        if (element.listType === "unordered") {
          element.items.forEach((item) => {
            markdown += `- ${unformatText(item)}\n`;
          });
        } else {
          element.items.forEach((item, index) => {
            markdown += `${index + 1}. ${unformatText(item)}\n`;
          });
        }
        markdown += "\n";
        break;

      case "question":
        markdown += `${unformatText(element.content)}\n`;
        
        // Añadir descripción si existe, inmediatamente después de la pregunta
        if (element.description) {
          markdown += `<!-- description: ${element.description} -->\n`;
        }
        
        markdown += "\n";
        break;

      case "choices":
        // Añadir la pregunta
        markdown += `${unformatText(element.question)}\n`;
        
        // Añadir descripción si existe, inmediatamente después de la pregunta
        if (element.description) {
          markdown += `<!-- description: ${element.description} -->\n`;
        }
        
        // Añadir las opciones
        if (element.choiceType === "multiple") {
          element.options.forEach((option) => {
            markdown += `- ${unformatText(option)}\n`;
          });
        } else {
          element.options.forEach((option, index) => {
            markdown += `${index + 1}. ${unformatText(option)}\n`;
          });
        }
        markdown += "\n";
        break;
    }
  }

  return markdown.trim();
}