const axios = require('axios');

async function quickTest() {
  try {
    console.log('🔍 Probando conexión al servidor...');
    const response = await axios.get('http://localhost:4041/health');
    console.log('✅ Servidor disponible:', response.data);
    
    console.log('\n🧪 Probando crear una empresa...');
    const companyData = {
      name: 'Empresa Test',
      address: 'Calle 123 #45-67',
      phone: '1234567890',
      email: 'test@empresa.com'
    };
    
    const companyResponse = await axios.post('http://localhost:4041/api/companies', companyData);
    console.log('✅ Empresa creada exitosamente:', companyResponse.data);
    
    console.log('\n🎉 ¡SÍ! El sistema puede crear registros en la base de datos');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 El servidor no está corriendo en el puerto 4041');
    }
  }
}

quickTest();
