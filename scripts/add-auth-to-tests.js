const fs = require('fs');
const path = require('path');

// Archivos de test a actualizar
const testFiles = [
  'tests/integration/role/role-endpoints.test.js',
  'tests/integration/company/company-endpoints.test.js',
  'tests/integration/rule/rule-endpoints.test.js'
];

function addAuthToRequests(content) {
  // Patrón: request(app).METHOD(url) -> request(app).METHOD(url).set('Authorization', `Bearer ${authToken}`)

  // Para métodos que ya tienen .send() o .query()
  let updated = content.replace(
    /(await request\(app\)\s*\n\s*\.(get|post|put|delete|patch)\([^)]+\))\s*\n\s*\.send\(/g,
    "$1\n      .set('Authorization', `Bearer ${authToken}`)\n      .send("
  );

  // Para métodos que terminan con ; directamente (GET sin body)
  updated = updated.replace(
    /(await request\(app\)\s*\n\s*\.(get|delete)\([^)]+\));/g,
    "$1\n      .set('Authorization', `Bearer ${authToken}`);"
  );

  return updated;
}

// Procesar cada archivo
testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  console.log(`Processing: ${file}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const updated = addAuthToRequests(content);

  // Guardar respaldo
  fs.writeFileSync(filePath + '.backup', content);

  // Escribir archivo actualizado
  fs.writeFileSync(filePath, updated);

  console.log(`✅ Updated: ${file}`);
});

console.log('\n✅ All test files updated!');
console.log('Backup files created with .backup extension');
