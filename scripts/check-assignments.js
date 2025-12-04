const DatabaseFactory = require('../src/infrastructure/factories/DatabaseFactory');

/**
 * Script para verificar asignaciones en la base de datos
 * Muestra las últimas asignaciones creadas y su información
 */
(async () => {
  try {
    console.log('\n🔍 Verificando asignaciones en la base de datos...\n');

    const db = await DatabaseFactory.initializeDatabase();
    const repos = DatabaseFactory.getRepositories(db);
    const sequelize = db.databaseAdapter.getSequelizeInstance();

    // Verificar total de asignaciones
    const totalCount = await repos.assignmentRepository.count();
    console.log(`📊 Total de asignaciones en BD: ${totalCount}\n`);

    // Obtener las últimas 10 asignaciones
    const recentAssignments = await repos.assignmentRepository.findAll({}, {
      limit: 10,
      offset: 0
    });

    if (recentAssignments.length === 0) {
      console.log('❌ No hay asignaciones en la base de datos\n');
      console.log('Esto indica que:');
      console.log('1. Los mensajes no están llegando a la cola');
      console.log('2. El servicio de cola no está procesando mensajes');
      console.log('3. Hay un error al guardar en BD que no se está capturando\n');
    } else {
      console.log(`📋 Últimas ${recentAssignments.length} asignaciones:\n`);

      recentAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. Asignación ID: ${assignment.id}`);
        console.log(`   Usuario: ${assignment.userInfo?.name || 'Sin asignar'} (ID: ${assignment.userId || 'NULL'})`);
        console.log(`   Empresa: ${assignment.companyInfo?.name || 'N/A'} (ID: ${assignment.companyId})`);
        console.log(`   Estado: ${assignment.status}`);
        console.log(`   ClaimId: ${assignment.ClaimId || 'N/A'}`);
        console.log(`   ProcessId: ${assignment.ProcessId || 'N/A'}`);
        console.log(`   Source: ${assignment.Source || 'N/A'}`);
        console.log(`   DocumentNumber: ${assignment.DocumentNumber || 'N/A'}`);
        console.log(`   Fecha asignación: ${assignment.assignedAt}`);
        console.log(`   Creado: ${assignment.createdAt}`);
        console.log('');
      });
    }

    // Verificar asignaciones por estado
    console.log('📊 Estadísticas por estado:\n');
    const [pendingCount, assignedCount, completedCount] = await Promise.all([
      repos.assignmentRepository.count({ status: 'pending' }),
      repos.assignmentRepository.count({ status: 'assigned' }),
      repos.assignmentRepository.count({ status: 'completed' })
    ]);

    console.log(`   ⏳ Pending: ${pendingCount}`);
    console.log(`   ✅ Assigned: ${assignedCount}`);
    console.log(`   🎯 Completed: ${completedCount}\n`);

    // Verificar asignaciones creadas hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAssignments = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM assignments
      WHERE created_at >= :todayStart
    `, {
      replacements: { todayStart: today },
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📅 Asignaciones creadas hoy: ${todayAssignments[0].count}\n`);

    // Verificar si hay claims sin usuario asignado
    const noUserAssignments = await repos.assignmentRepository.findAll({ userId: null }, { limit: 5 });
    if (noUserAssignments.length > 0) {
      console.log(`⚠️  Hay ${noUserAssignments.length} asignaciones SIN usuario asignado (userId NULL):`);
      noUserAssignments.forEach(a => {
        console.log(`   - ClaimId: ${a.ClaimId}, Status: ${a.status}, Creado: ${a.createdAt}`);
      });
      console.log('');
    }

    await db.databaseAdapter.disconnect();
    console.log('✅ Verificación completada\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
