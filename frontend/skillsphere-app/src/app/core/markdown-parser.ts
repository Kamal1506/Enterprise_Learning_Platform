export function parseMarkdown(md: string): string {
  if (!md) return '';

  let html = md;

  // Escape HTML to prevent injection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore the blockquote/alert brackets we escaped
  html = html.replace(/&gt;\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, (match, alertType) => {
    return `> [!${alertType.toUpperCase()}]`;
  });

  // Handle tables
  const lines = html.split('\n');
  let inTable = false;
  let tableRows: string[] = [];
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        processedLines.push(renderTable(tableRows));
        inTable = false;
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable) {
    processedLines.push(renderTable(tableRows));
  }
  html = processedLines.join('\n');

  // Headers (e.g. ### Text -> <h3>Text</h3>)
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Blockquotes / Alerts
  html = html.replace(/^&gt;\s+\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([\s\S]*?)(?=(?:^&gt;|\n\n|\n[^\s&gt;]))/gim, (match, type, content) => {
    const cleanContent = content.replace(/^&gt;\s?/gm, '').trim();
    return `<div class="alert alert-${type.toLowerCase()}">${cleanContent}</div>`;
  });
  html = html.replace(/^&gt;\s+(.*?)$/gm, '<blockquote>$1</blockquote>');

  // Bold (**text** -> <strong>text</strong>)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Inline Code (`code` -> <code>code</code>)
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Bullet Lists (simple list items)
  html = html.replace(/^\s*[-*+]\s+(.*?)$/gm, '<li>$1</li>');
  // Group adjacent <li> items into <ul>
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  // Line breaks / paragraphs (convert double newlines to paragraph tags or margins)
  html = html.replace(/\n\n/g, '<p></p>');
  html = html.replace(/\n/g, '<br/>');

  return html;
}

function renderTable(rows: string[]): string {
  if (rows.length < 2) return '';

  let html = '<div class="table-responsive"><table class="markdown-table">';
  let hasHeader = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Check if this is the separator row (e.g. |---|---|)
    if (i === 1 && row.replace(/[\s|:\-]/g, '') === '') {
      continue; // Skip separator row
    }

    const cells = row
      .split('|')
      .map(c => c.trim())
      .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (cells.length === 0) continue;

    if (!hasHeader) {
      html += '<thead><tr>';
      cells.forEach(cell => {
        html += `<th>${cell}</th>`;
      });
      html += '</tr></thead><tbody>';
      hasHeader = true;
    } else {
      html += '<tr>';
      cells.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    }
  }

  if (hasHeader) {
    html += '</tbody>';
  }
  html += '</table></div>';
  return html;
}
