//  TXT
export async function convertTxtToMarkdown(arrayBuffer) {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(arrayBuffer);
    return text.trim();
}

//  DOCX
export async function convertDocxToMarkdown(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xmlContent = await zip.file("word/document.xml").async("text");
    const xml = new DOMParser().parseFromString(xmlContent, "text/xml");

    const paragraphs = Array.from(xml.getElementsByTagName("w:p"));
    let markdown = "";

    for (const p of paragraphs) {
        const text = extractText(p).trim();
        if (!text) continue;

        const listInfo = getListLevel(p);
        if (listInfo) {
            const indent = "  ".repeat(listInfo.level);
            markdown += `${indent}- ${text}\n`;
        } else {
            markdown += `\n${text}\n`;
        }
    }

    return markdown.trim();
}

function extractText(paragraphNode) {
    const texts = paragraphNode.getElementsByTagName("w:t");
    return Array.from(texts).map(t => t.textContent).join("");
}

function getListLevel(paragraphNode) {
    const numPr = paragraphNode.getElementsByTagName("w:numPr")[0];
    if (!numPr) return null;
    const ilvl = numPr.getElementsByTagName("w:ilvl")[0];
    const level = ilvl ? parseInt(ilvl.getAttribute("w:val")) : 0;
    return {
        level
    };
}

// PDF
export async function convertPdfToMarkdown(arrayBuffer) {
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;
    let markdown = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items;

        // Agrupar por coordenada Y (simulando líneas)
        const linesMap = new Map();

        for (const item of items) {
            const y = Math.round(item.transform[5]); // posición Y
            const x = Math.round(item.transform[4]); // posición X
            const str = item.str.trim();

            if (!str) continue;

            if (!linesMap.has(y)) linesMap.set(y, []);
            linesMap.get(y).push({
                x,
                str
            });
        }

        // Ordenar líneas de arriba a abajo
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

        for (const y of sortedY) {
            const line = linesMap.get(y).sort((a, b) => a.x - b.x);
            const fullLine = line.map(l => l.str).join(" ").trim();
            const indent = detectIndentLevel(line[0] ?.x || 0);

            // Detectamos listas
            const isBullet = /^[-•▪●◦]/.test(fullLine);
            const cleanText = fullLine.replace(/^[-•▪●◦]\s*/, "");

            if (isBullet) {
                markdown += `${"  ".repeat(indent)}- ${cleanText}\n`;
            } else {
                markdown += `${"  ".repeat(indent)}${cleanText}\n`;
            }
        }

        markdown += "\n"; // separador entre páginas
    }

    return markdown.trim();
}

function detectIndentLevel(x) {
    if (x < 50) return 0;
    if (x < 100) return 1;
    if (x < 150) return 2;
    if (x < 200) return 3;
    return 4;
}