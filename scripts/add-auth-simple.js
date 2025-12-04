const fs = require('fs');
const path = require('path');

const backup = path.join(__dirname, '..', 'tests/integration/role/role-endpoints.test.js.backup');
const output = path.join(__dirname, '..', 'tests/integration/role/role-endpoints.test.js');

let content = fs.readFileSync(backup, 'utf8');

// Reemplazar request(app)\n      .METHOD(url)\n      .send con auth header
content = content.replace(
  /(await request\(app\))\n(\s+)(\.(?:post|put|patch|delete)\([^\)]+\))\n(\s+)(\.send\()/g,
  "$1\n$2$3\n$2.set('Authorization', `Bearer \\${authToken}`)\n$4$5"
);

// Reemplazar request(app)\n      .GET(url); con auth header
content = content.replace(
  /(await request\(app\))\n(\s+)(\.get\([^\)]+\));/g,
  "$1\n$2$3\n$2.set('Authorization', `Bearer \\${authToken}`);"
);

// Casos especiales donde hay líneas intermedias
content = content.replace(
  /(await request\(app\))\n(\s+)(\.get\([^;]+)\n(\s+)\./g,
  "$1\n$2$3\n$2.set('Authorization', `Bearer \\${authToken}`)\n$4."
);

fs.writeFileSync(output, content);
console.log('✅ Auth headers added to role-endpoints.test.js');
