/**
 * Sistema de Criticidad de Tests
 *
 * Define niveles de criticidad para organizar y priorizar la ejecución de tests
 */

const CRITICALITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const CRITICALITY_DESCRIPTIONS = {
  [CRITICALITY.CRITICAL]: {
    level: 'CRÍTICA',
    description: 'Funcionalidad esencial del sistema. Fallos bloquean operación.',
    examples: [
      'Conexión a base de datos',
      'Conexión a RabbitMQ',
      'Sistema de asignaciones automáticas',
      'Autenticación y seguridad',
      'Creación de entidades core (empresas, usuarios)'
    ],
    icon: '🔴'
  },
  [CRITICALITY.HIGH]: {
    level: 'ALTA',
    description: 'Funcionalidad principal del negocio. Impacta operaciones importantes.',
    examples: [
      'Gestión de roles y permisos',
      'Creación y actualización de reglas',
      'Procesamiento de asignaciones',
      'Validaciones de negocio',
      'APIs principales'
    ],
    icon: '🟠'
  },
  [CRITICALITY.MEDIUM]: {
    level: 'MEDIA',
    description: 'Funcionalidad secundaria. Importante pero no bloquea operaciones.',
    examples: [
      'Búsqueda y filtros',
      'Estadísticas y reportes',
      'Configuraciones de empresa',
      'Endpoints de consulta',
      'Validaciones no críticas'
    ],
    icon: '🟡'
  },
  [CRITICALITY.LOW]: {
    level: 'BAJA',
    description: 'Funcionalidad auxiliar. No afecta operaciones principales.',
    examples: [
      'Formateo de respuestas',
      'Ordenamiento de resultados',
      'Paginación',
      'Endpoints informativos',
      'Features opcionales'
    ],
    icon: '🟢'
  }
};

/**
 * Helper para crear describe con criticidad
 * @param {string} criticality - Nivel de criticidad (CRITICAL, HIGH, MEDIUM, LOW)
 * @param {string} description - Descripción del test suite
 * @param {Function} fn - Función del test suite
 */
function describeCriticality(criticality, description, fn) {
  const tag = `[@${criticality}]`;
  return describe(`${tag} ${description}`, fn);
}

/**
 * Shortcuts para cada nivel de criticidad
 */
const describeCritical = (description, fn) => describeCriticality(CRITICALITY.CRITICAL, description, fn);
const describeHigh = (description, fn) => describeCriticality(CRITICALITY.HIGH, description, fn);
const describeMedium = (description, fn) => describeCriticality(CRITICALITY.MEDIUM, description, fn);
const describeLow = (description, fn) => describeCriticality(CRITICALITY.LOW, description, fn);

/**
 * Obtener configuración de Jest para ejecutar por criticidad
 */
function getJestConfigForCriticality(criticality) {
  return {
    testMatch: ['**/*.test.js'],
    testNamePattern: `@${criticality}`
  };
}

/**
 * Función helper para reportar criticidad de tests
 */
function reportCriticality(results) {
  const critical = results.filter(r => r.includes('@critical')).length;
  const high = results.filter(r => r.includes('@high')).length;
  const medium = results.filter(r => r.includes('@medium')).length;
  const low = results.filter(r => r.includes('@low')).length;

  console.log('\n📊 Tests por Criticidad:');
  console.log(`${CRITICALITY_DESCRIPTIONS[CRITICALITY.CRITICAL].icon} Críticos: ${critical}`);
  console.log(`${CRITICALITY_DESCRIPTIONS[CRITICALITY.HIGH].icon} Altos: ${high}`);
  console.log(`${CRITICALITY_DESCRIPTIONS[CRITICALITY.MEDIUM].icon} Medios: ${medium}`);
  console.log(`${CRITICALITY_DESCRIPTIONS[CRITICALITY.LOW].icon} Bajos: ${low}`);
  console.log(`\n📝 Total: ${critical + high + medium + low}`);
}

module.exports = {
  CRITICALITY,
  CRITICALITY_DESCRIPTIONS,
  describeCriticality,
  describeCritical,
  describeHigh,
  describeMedium,
  describeLow,
  getJestConfigForCriticality,
  reportCriticality
};
