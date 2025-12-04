const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tests/integration/role/role-endpoints.test.js');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  newLines.push(line);

  // Si es una línea con .send( y la línea anterior no tiene .set('Authorization'
  if (line.includes('.send(') && i > 0 && !lines[i-1].includes('.set(\'Authorization\'')) {
    // Insertar header antes de .send
    const indent = line.match(/^(\s*)/)[0];
    newLines.splice(newLines.length - 1, 0, `${indent}.set('Authorization', \`Bearer \${authToken}\`)`);
  }

  // Si es una línea con request().METHOD() que termina en ; y no tiene .set después
  if ((line.includes('.get(') || line.includes('.delete(')) && line.trim().endsWith(');')) {
    if (i + 1 < lines.length && !lines[i+1].includes('.set(\'Authorization\'')) {
      const indent = line.match(/^(\s*)/)[0];
      newLines.push(`${indent}.set('Authorization', \`Bearer \${authToken}\`);`);
      // Remover el ; de la línea actual
      newLines[newLines.length - 2] = newLines[newLines.length - 2].replace(/;$/, '');
    }
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('✅ All auth headers added!');
