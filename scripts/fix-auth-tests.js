const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tests/integration/role/role-endpoints.test.js.backup');
const outputPath = path.join(__dirname, '..', 'tests/integration/role/role-endpoints.test.js');

let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');
let newLines = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];

  // Si encontramos una línea con request(app) seguida de .METHOD
  if (line.includes('await request(app)') || line.trim().startsWith('.post(') || line.trim().startsWith('.get(') ||
      line.trim().startsWith('.put(') || line.trim().startsWith('.delete(')) {

    newLines.push(line);
    i++;

    // Buscar la línea del método (.post, .get, etc.)
    while (i < lines.length && !lines[i].trim().startsWith('.') && !lines[i].trim().startsWith('.send') && !lines[i].includes(');')) {
      newLines.push(lines[i]);
      i++;
    }

    // Si la siguiente línea es un método HTTP
    if (i < lines.length && (lines[i].trim().startsWith('.post(') || lines[i].trim().startsWith('.get(') ||
        lines[i].trim().startsWith('.put(') || lines[i].trim().startsWith('.delete('))) {
      newLines.push(lines[i]);
      i++;
    }

    // Si la siguiente línea NO es .set('Authorization'
    if (i < lines.length && !lines[i].includes('.set(\'Authorization\'')) {
      // Agregar el header de autorización
      const indent = lines[i].match(/^(\s*)/)[0];
      newLines.push(`${indent}.set('Authorization', \`Bearer \${authToken}\`)`);
    }

    continue;
  }

  newLines.push(line);
  i++;
}

fs.writeFileSync(outputPath, newLines.join('\n'));
console.log('✅ File updated successfully!');
