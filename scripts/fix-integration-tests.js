const fs = require('fs');
const path = require('path');

// Función para procesar archivo de test
function addAuthHeaders(filePath) {
  console.log(`\n📝 Processing: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const result = [];

  // Agregar import del authHelper si no existe
  let hasAuthHelper = false;
  let hasAuthToken = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Verificar si ya tiene authHelper
    if (line.includes("require('../../helpers/authHelper')")) {
      hasAuthHelper = true;
    }

    // Agregar authHelper import después de los otros requires
    if (!hasAuthHelper && line.includes("require('../../../src/infrastructure/web/server')")) {
      result.push(line);
      result.push("const authHelper = require('../../helpers/authHelper');");
      hasAuthHelper = true;
      continue;
    }

    // Agregar variable authToken en el describe
    if (!hasAuthToken && line.trim().startsWith('let createdCompanyId') || line.trim().startsWith('let server')) {
      if (!content.includes('let authToken;')) {
        result.push('  let authToken;');
        hasAuthToken = true;
      }
    }

    // Agregar generación de token en beforeAll
    if (line.includes('beforeAll(async () => {')) {
      result.push(line);
      i++;
      // Agregar líneas hasta encontrar await server.start()
      while (i < lines.length && !lines[i].includes('await server.start()')) {
        result.push(lines[i]);
        i++;
      }
      result.push(lines[i]); // await server.start()

      // Agregar generación de token
      if (!content.includes('authHelper.generateAdminToken()')) {
        result.push('');
        result.push('    // Generar token de autenticación para tests');
        result.push('    authToken = authHelper.generateAdminToken();');
      }
      continue;
    }

    // Agregar .set('Authorization') antes de .send(
    if (line.includes('.send(') && i > 0) {
      const prevLine = lines[i - 1];
      // Solo agregar si no tiene ya el header
      if (!prevLine.includes('.set(\'Authorization\'')) {
        const indent = line.match(/^(\s*)/)[0];
        result.push(`${indent}.set('Authorization', \`Bearer \${authToken}\`)`);
      }
    }

    // Agregar .set('Authorization') después de .get( que termina en )
    if ((line.includes('.get(') || line.includes('.delete(')) &&
        line.includes(');') &&
        !lines[i + 1]?.includes('.set(\'Authorization\'')) {
      // Remover el ;
      const lineWithoutSemicolon = line.replace(/;$/, '');
      result.push(lineWithoutSemicolon);
      const indent = line.match(/^(\s*)/)[0];
      result.push(`${indent}.set('Authorization', \`Bearer \${authToken}\`);`);
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

// Procesar archivos
const testFiles = [
  'tests/integration/role/role-endpoints.test.js',
  'tests/integration/company/company-endpoints.test.js',
  'tests/integration/rule/rule-endpoints.test.js'
];

testFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  try {
    const updated = addAuthHeaders(filePath);

    // Crear backup
    fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));

    // Escribir actualizado
    fs.writeFileSync(filePath, updated);

    console.log(`✅ Updated: ${file}`);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n✅ All integration tests updated with auth headers!');
