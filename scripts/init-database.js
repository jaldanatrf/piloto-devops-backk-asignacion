#!/usr/bin/env node

/**
 * Script para inicializar base de datos nueva
 * Crea todas las tablas automáticamente desde modelos Sequelize
 *
 * Uso:
 *   node scripts/init-database.js
 *   node scripts/init-database.js --force  (recrea tablas existentes - PELIGROSO)
 */

const DatabaseFactory = require('../src/infrastructure/factories/DatabaseFactory');

async function initDatabase() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         INICIALIZADOR DE BASE DE DATOS AUTOMÁTICO             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let databaseService;

  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    if (force) {
      console.log('⚠️  MODO FORCE ACTIVADO - Se recrearán tablas existentes');
      console.log('⚠️  ADVERTENCIA: Esto eliminará todos los datos');
      console.log('\n❓ ¿Continuar? (Ctrl+C para cancelar)\n');

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Inicializar base de datos
    console.log('🚀 Iniciando proceso de inicialización...\n');
    databaseService = await DatabaseFactory.initializeDatabase();

    console.log('\n✅ Base de datos inicializada correctamente');
    console.log('\n📊 Siguiente paso: Verificar que todas las tablas existan');
    console.log('   Ejecutar: node scripts/migrate.js status\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error inicializando base de datos:', error.message);
    console.error(error.stack);
    process.exit(1);

  } finally {
    // Cerrar conexión
    if (databaseService) {
      try {
        await databaseService.disconnect();
        console.log('🔌 Conexión cerrada');
      } catch (err) {
        console.error('Error cerrando conexión:', err.message);
      }
    }
  }
}

// Ejecutar
initDatabase();
