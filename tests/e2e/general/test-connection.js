// Test simple para verificar conectividad
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4041,
  path: '/health',
  method: 'GET'
};

console.log('🔍 Verificando conectividad del servidor...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Servidor respondió:', JSON.parse(data));
    console.log('🎉 ¡El servidor está funcionando correctamente!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conectividad:', error.message);
  console.log('💡 Asegúrate de que el servidor esté corriendo en el puerto 4041');
});

req.end();
