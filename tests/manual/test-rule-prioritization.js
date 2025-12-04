/**
 * Script para probar la priorización correcta de reglas
 *
 * Caso de prueba del usuario:
 * - Source: 860037950 (Fundación Santa Fe - empresa que TIENE las reglas)
 * - Target: 901002487 (CTIC - empresa destino)
 * - ObjectionCode: abc123
 *
 * Reglas configuradas en Source (860037950):
 * 1. COMPANY-CODE con NIT 860037950 y código abc123 → Debe aplicar (prioridad 2)
 * 2. CODE con código abc123 → Debe aplicar pero ser descartada por priorización (prioridad 6)
 *
 * Resultado esperado: Solo usuarios de COMPANY-CODE deben ser notificados
 */

const BusinessRuleProcessorUseCases = require('../../src/application/useCases/businessRules/BusinessRuleProcessorUseCases');
const DatabaseFactory = require('../../src/infrastructure/factories/DatabaseFactory');

async function testRulePrioritization() {
  console.log('🧪 Test: Priorización de reglas COMPANY-CODE vs CODE\n');
  console.log('═'.repeat(70));

  try {
    // Inicializar base de datos
    const databaseService = await DatabaseFactory.initializeDatabase();
    const repositories = DatabaseFactory.getRepositories(databaseService);

    // Crear instancia del caso de uso
    const businessRuleProcessor = new BusinessRuleProcessorUseCases(
      repositories.companyRepository,
      repositories.ruleRepository,
      repositories.ruleRoleRepository,
      repositories.userRoleRepository,
      repositories.userRepository,
      repositories.roleRepository
    );

    // Mensaje de prueba del usuario (CORREGIDO)
    const claimMessage = {
      ProcessId: "LOTE-20251003163406-EDEBBF84",
      Source: "860037950",           // Empresa que TIENE las reglas (Fundación Santa Fe)
      Target: "901002487",           // Empresa destino (CTIC)
      DocumentNumber: "901002487_20253152",
      InvoiceAmount: 1340,
      ExternalReference: "11",
      ClaimId: "901002487_20253152_11_GLO_TA02",
      ConceptApplicationCode: "GLO",
      ObjectionCode: "abc123",       // Código de objeción
      Value: 1340
    };

    console.log('\n📨 Mensaje de prueba:');
    console.log(JSON.stringify(claimMessage, null, 2));
    console.log('\n' + '═'.repeat(70));

    // Verificar reglas existentes para la empresa Source
    console.log('\n🔍 Verificando reglas existentes para empresa Source (860037950)...\n');
    const sourceCompany = await repositories.companyRepository.findByDocumentNumber('860037950');
    if (sourceCompany) {
      const allRules = await repositories.ruleRepository.findByCompany(sourceCompany.id);
      console.log(`📋 Total de reglas configuradas: ${allRules.length}`);
      allRules.forEach(rule => {
        console.log(`   - ${rule.name} (Tipo: ${rule.type}, Activa: ${rule.isActive}, NIT: ${rule.nitAssociatedCompany || 'N/A'}, Code: ${rule.code || 'N/A'})`);
      });
    } else {
      console.log('❌ Empresa Source no encontrada');
    }

    // Procesar reclamación
    console.log('\n' + '═'.repeat(70));
    console.log('\n🔄 Procesando reclamación...\n');
    const result = await businessRuleProcessor.processClaim(claimMessage);

    // Mostrar resultados
    console.log('\n' + '═'.repeat(70));
    console.log('📊 RESULTADOS:');
    console.log('═'.repeat(70));

    console.log(`\n✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log(`\n🏢 Empresa con reglas:`);
    console.log(`   - Nombre: ${result.company.name}`);
    console.log(`   - NIT: ${result.company.documentNumber}`);

    console.log(`\n📋 Reglas evaluadas: ${result.totalRulesEvaluated}`);
    console.log(`✅ Reglas aplicadas: ${result.totalRulesApplied}`);

    if (result.appliedRules && result.appliedRules.length > 0) {
      console.log(`\n📝 Detalle de reglas aplicadas:`);
      result.appliedRules.forEach((rule, index) => {
        if (rule.applies) {
          console.log(`   ${index + 1}. ${rule.name} (${rule.type})`);
          console.log(`      - Aplica: ${rule.applies}`);
          console.log(`      - Razón: ${rule.reason}`);
          console.log(`      - NIT asociado: ${rule.nitAssociatedCompany || 'N/A'}`);
          console.log(`      - Código: ${rule.code || 'N/A'}`);
        }
      });
    }

    console.log(`\n👥 Usuarios a notificar: ${result.users.length}`);
    if (result.users && result.users.length > 0) {
      result.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.dud})`);
        console.log(`      - Rol: ${user.role?.name || 'N/A'}`);
        if (user.appliedRules && user.appliedRules.length > 0) {
          console.log(`      - Reglas aplicadas: ${user.appliedRules.map(r => r.type).join(', ')}`);
        }
      });
    }

    // Validar resultado esperado
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 VALIDACIÓN:');
    console.log('═'.repeat(70));

    const hasCompanyCode = result.appliedRules.some(r => r.type === 'COMPANY-CODE' && r.applies);
    const hasCode = result.appliedRules.some(r => r.type === 'CODE' && r.applies);

    console.log(`\n✓ Regla COMPANY-CODE aplicó: ${hasCompanyCode ? '✅ SÍ' : '❌ NO'}`);
    console.log(`✓ Regla CODE aplicó: ${hasCode ? '✅ SÍ' : '❌ NO'}`);

    if (hasCompanyCode && hasCode) {
      console.log('\n✅ Ambas reglas aplicaron correctamente');

      // Verificar que solo usuarios de COMPANY-CODE fueron seleccionados
      const usersHaveOnlyCompanyCode = result.users.every(user => {
        return user.appliedRules && user.appliedRules.some(r => r.type === 'COMPANY-CODE');
      });

      if (usersHaveOnlyCompanyCode && result.users.length > 0) {
        console.log('✅ PRIORIZACIÓN CORRECTA: Solo usuarios de COMPANY-CODE fueron seleccionados');
      } else if (result.users.length === 0) {
        console.log('⚠️  No se encontraron usuarios para las reglas aplicadas');
      } else {
        console.log('❌ ERROR: La priorización no funcionó correctamente');
      }
    } else if (!hasCompanyCode && hasCode) {
      console.log('\n⚠️  Solo CODE aplicó. Verificar configuración de regla COMPANY-CODE');
    } else if (hasCompanyCode && !hasCode) {
      console.log('\n⚠️  Solo COMPANY-CODE aplicó. Verificar configuración de regla CODE');
    } else {
      console.log('\n❌ Ninguna regla aplicó. Verificar configuración de reglas');
    }

    console.log('\n' + '═'.repeat(70));

    // Cerrar conexión
    await databaseService.shutdown();

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar prueba
testRulePrioritization()
  .then(() => {
    console.log('\n✅ Prueba completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
