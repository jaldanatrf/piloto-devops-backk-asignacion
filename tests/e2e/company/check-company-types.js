const { Sequelize } = require('sequelize');
const config = require('../../../src/infrastructure/config');

async function checkCompanyTypes() {
  try {
    console.log('Conectando a la base de datos...');
    
    const sequelize = new Sequelize(
      config.database.database,
      config.database.username,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: 'mssql',
        logging: false
      }
    );

    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Consultar todos los tipos únicos de company
    const [results] = await sequelize.query(`
      SELECT DISTINCT type, COUNT(*) as count 
      FROM companies 
      GROUP BY type 
      ORDER BY type
    `);

    console.log('\n📊 Tipos de company encontrados en la base de datos:');
    console.log('================================================');
    
    if (results.length === 0) {
      console.log('❌ No se encontraron registros en la tabla companies');
    } else {
      results.forEach(row => {
        const isValid = ['PAYER', 'PROVIDER'].includes(row.type?.toUpperCase());
        const status = isValid ? '✅' : '❌';
        console.log(`${status} Tipo: "${row.type}" - Cantidad: ${row.count} ${!isValid ? '(INVÁLIDO)' : ''}`);
      });
    }

    // Mostrar registros específicos con tipos inválidos
    const [invalidRecords] = await sequelize.query(`
      SELECT id, name, type 
      FROM companies 
      WHERE UPPER(type) NOT IN ('PAYER', 'PROVIDER')
    `);

    if (invalidRecords.length > 0) {
      console.log('\n🚨 Registros con tipos inválidos:');
      console.log('=====================================');
      invalidRecords.forEach(record => {
        console.log(`ID: ${record.id}, Nombre: "${record.name}", Tipo: "${record.type}"`);
      });
      
      console.log('\n💡 Opciones para resolver el problema:');
      console.log('1. Actualizar los registros inválidos a PAYER o PROVIDER');
      console.log('2. Modificar la validación en la entidad Company para permitir más tipos');
      console.log('3. Crear un script de migración para corregir los datos');
    } else {
      console.log('\n✅ Todos los registros tienen tipos válidos (PAYER o PROVIDER)');
    }

    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');

  } catch (error) {
    console.error('❌ Error al verificar tipos de company:', error);
    process.exit(1);
  }
}

// Ejecutar el script
checkCompanyTypes();
