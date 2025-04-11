// Unique ID generator for elements
let idCounter = 0;
const generateId = () => {
    idCounter += 1;
    return `element-${idCounter}`;
};

/**
 * Parse markdown text into structured data
 * @param {string} markdown - The markdown text to parse
 * @returns {Array} - Array of parsed elements
 */
function parseMarkdown(markdown) {
    const lines = markdown.split("\n");
    const result = [];

    let currentList = [];
    let listType = null;
    let currentQuestion = "";
    let currentDescription = "";
    let lastItemType = null;
    let lastItemIndex = -1;

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
            continue;
        }

        // Check for description lines
        if (line.startsWith("@desc:")) {
            const description = line.substring(6).trim();

            // If the previous item was a question, add the description to it
            if (lastItemType === "question" && lastItemIndex >= 0) {
                result[lastItemIndex].description = description;
            }
            // If we're in the middle of a list with a question, store the description
            else if (currentQuestion) {
                currentDescription = description;
            }
            continue;
        }

        // Check for headings
        if (line.startsWith("# ")) {
            // If we were building a list, add it to the result before adding the heading
            if (currentList.length > 0) {
                addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                currentList = [];
                listType = null;
                currentQuestion = "";
                currentDescription = "";
            }

            result.push({
                type: "heading1",
                content: line.substring(2),
            });
            lastItemType = "heading1";
            lastItemIndex = result.length - 1;
            continue;
        }

        if (line.startsWith("## ")) {
            // If we were building a list, add it to the result before adding the heading
            if (currentList.length > 0) {
                addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                currentList = [];
                listType = null;
                currentQuestion = "";
                currentDescription = "";
            }

            result.push({
                type: "heading2",
                content: line.substring(3),
            });
            lastItemType = "heading2";
            lastItemIndex = result.length - 1;
            continue;
        }

        if (line.startsWith("### ")) {
            // If we were building a list, add it to the result before adding the heading
            if (currentList.length > 0) {
                addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                currentList = [];
                listType = null;
                currentQuestion = "";
                currentDescription = "";
            }

            result.push({
                type: "heading3",
                content: line.substring(4),
            });
            lastItemType = "heading3";
            lastItemIndex = result.length - 1;
            continue;
        }

        // Check for lists
        const bulletListMatch = line.match(/^[-*] (.+)/);
        const orderedListMatch = line.match(/^\d+\. (.+)/);

        if (bulletListMatch || orderedListMatch) {
            const content = bulletListMatch ? bulletListMatch[1] : orderedListMatch[1];

            // Check for special list types
            if (content.endsWith("?M")) {
                // Start a new multiple choice list
                if (currentList.length > 0 && listType !== "multipleChoice") {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    currentDescription = "";
                }

                listType = "multipleChoice";
                currentQuestion = content.substring(0, content.length - 2);
                continue;
            } else if (content.endsWith("?O")) {
                // Start a new single choice list
                if (currentList.length > 0 && listType !== "singleChoice") {
                    addListToResult(result, currentList, listType, currentQuestion, currentDescription);
                    currentList = [];
                    currentDescription = "";
                }

                listType = "singleChoice";
                currentQuestion = content.substring(0, content.length - 2);
                continue;
            }

            // If we're already building a multiple choice or single choice list,
            // add this item to that list
            if (listType === "multipleChoice" || listType === "singleChoice") {
                currentList.push(content);
                continue;
            }

            // If we're not already building a list, start a new one
            if (currentList.length === 0 && !listType) {
                listType = bulletListMatch ? "bullet" : "ordered";
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
        }

        // Check for questions (Spanish or English)
        if (
            (line.startsWith("¿") && line.endsWith("?")) ||
            (line.endsWith("?") && !line.endsWith("?M") && !line.endsWith("?O")) ||
            line.endsWith("?Q")
        ) {
            // Remove the ?Q suffix if present
            const questionContent = line.endsWith("?Q") ? line.substring(0, line.length - 2) + "?" : line;

            const questionItem = {
                type: "question",
                content: questionContent,
                id: generateId(),
                description: "",
                longAnswer: false,
            };

            result.push(questionItem);
            lastItemType = "question";
            lastItemIndex = result.length - 1;
            continue;
        }

        // Default to paragraph
        result.push({
            type: "paragraph",
            content: line,
        });
        lastItemType = "paragraph";
        lastItemIndex = result.length - 1;
    }

    // Add any remaining list
    if (currentList.length > 0) {
        addListToResult(result, currentList, listType, currentQuestion, currentDescription);
    }

    return result;
}

/**
 * Add a list to the result array
 */
function addListToResult(result, list, type, question, description) {
    if (type === "multipleChoice") {
        result.push({
            type: "multipleChoice",
            question,
            options: list,
            id: generateId(),
            description,
        });
    } else if (type === "singleChoice") {
        result.push({
            type: "singleChoice",
            question,
            options: list,
            id: generateId(),
            description,
        });
    } else if (type === "bullet") {
        result.push({
            type: "list",
            items: list,
        });
    } else if (type === "ordered") {
        result.push({
            type: "orderedList",
            items: list,
        });
    }
}

/**
 * Generate markdown from parsed content
 * @param {Array} content - Array of parsed elements
 * @returns {string} - Markdown text
 */
function generateMarkdown(content) {
    let markdown = "";

    content.forEach((item, index) => {
        // Add a newline between items
        if (index > 0) {
            markdown += "\n\n";
        }

        switch (item.type) {
            case "heading1":
                markdown += `# ${item.content}`;
                break;

            case "heading2":
                markdown += `## ${item.content}`;
                break;

            case "heading3":
                markdown += `### ${item.content}`;
                break;

            case "paragraph":
                markdown += item.content;
                break;

            case "question":
                markdown += item.content;
                if (item.description) {
                    markdown += `\n@desc: ${item.description}`;
                }
                break;

            case "multipleChoice":
                markdown += `- ${item.question}?M`;
                if (item.description) {
                    markdown += `\n@desc: ${item.description}`;
                }
                item.options.forEach((option) => {
                    markdown += `\n- ${option}`;
                });
                break;

            case "singleChoice":
                markdown += `- ${item.question}?O`;
                if (item.description) {
                    markdown += `\n@desc: ${item.description}`;
                }
                item.options.forEach((option) => {
                    markdown += `\n- ${option}`;
                });
                break;

            case "list":
                item.items.forEach((listItem) => {
                    markdown += `\n- ${listItem}`;
                });
                break;

            case "orderedList":
                item.items.forEach((listItem, idx) => {
                    markdown += `\n${idx + 1}. ${listItem}`;
                });
                break;
        }
    });

    return markdown;
}