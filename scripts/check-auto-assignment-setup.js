/**
 * 🔧 Setup Helper para Servicio de Asignaciones Automáticas
 * 
 * Este script verifica la configuración y dependencias necesarias
 * para el servicio de asignaciones automáticas.
 * 
 * Uso: node scripts/check-auto-assignment-setup.js
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  
  log(`${status} ${description}: ${filePath}`, color);
  return exists;
}

function checkEnvVariable(varName, description) {
  const value = process.env[varName];
  const exists = value !== undefined && value !== '';
  const status = exists ? '✅' : '⚠️';
  const color = exists ? 'green' : 'yellow';
  
  log(`${status} ${description}: ${varName} = ${exists ? '[SET]' : '[NOT SET]'}`, color);
  return exists;
}

function main() {
  log('🔧 Auto Assignment Service Setup Check', 'cyan');
  log(''.padEnd(50, '='), 'cyan');
  
  // Verificar archivos del servicio
  log('\n📁 Core Service Files:', 'bright');
  const files = [
    'src/application/services/AssignmentQueueService.js',
    'src/application/useCases/assignment/AutoAssignmentUseCases.js',
    'src/infrastructure/web/controllers/AutoAssignmentController.js',
    'src/infrastructure/web/routes/autoAssignmentRoutes.js',
    'src/infrastructure/bootstrap/AutoAssignmentBootstrap.js'
  ];
  
  let allFilesExist = true;
  files.forEach(file => {
    const exists = checkFile(file, 'Service File');
    allFilesExist = allFilesExist && exists;
  });
  
  // Verificar archivos de dependencias
  log('\n📄 Dependency Files:', 'bright');
  const depFiles = [
    'src/application/useCases/rules/BusinessRuleProcessorUseCases.js',
    'src/domain/entities/Claim.js',
    'src/domain/entities/assignment.js',
    'src/domain/entities/users.js',
    'src/infrastructure/web/server.js'
  ];
  
  depFiles.forEach(file => {
    const exists = checkFile(file, 'Dependency');
    allFilesExist = allFilesExist && exists;
  });
  
  // Verificar configuración
  log('\n⚙️ Configuration:', 'bright');
  
  // Cargar variables de entorno
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    log('⚠️ Could not load .env.local', 'yellow');
  }
  
  const envVars = [
    { name: 'ASSIGNMENT_QUEUE', description: 'RabbitMQ Queue URL', required: true },
    { name: 'AUTO_START_QUEUE', description: 'Auto-start queue service', required: false }
  ];
  
  let configOk = true;
  envVars.forEach(({ name, description, required }) => {
    const exists = checkEnvVariable(name, description);
    if (required && !exists) {
      configOk = false;
    }
  });
  
  // Verificar dependencias npm
  log('\n📦 Dependencies:', 'bright');
  const packageJson = require('../package.json');
  const requiredDeps = ['amqplib', 'express', 'sequelize', 'winston'];
  
  let depsOk = true;
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep];
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    
    log(`${status} ${dep}: ${exists ? packageJson.dependencies[dep] : 'NOT INSTALLED'}`, color);
    depsOk = depsOk && exists;
  });
  
  // Verificar estructura de base de datos (simulado)
  log('\n🗄️ Database Requirements:', 'bright');
  log('✅ assignments table (assumed existing)', 'green');
  log('✅ users table (assumed existing)', 'green');
  log('✅ companies table (assumed existing)', 'green');
  log('✅ rules table (assumed existing)', 'green');
  
  // Resumen
  log('\n📋 Summary:', 'bright');
  log(''.padEnd(50, '-'), 'cyan');
  
  const overallStatus = allFilesExist && configOk && depsOk;
  
  if (overallStatus) {
    log('🎉 Setup OK! Ready to start Auto Assignment Service', 'green');
    log('\nNext steps:', 'bright');
    log('1. npm run local                    # Start server', 'cyan');
    log('2. POST /api/auto-assignments/service/start  # Start queue service', 'cyan');
    log('3. node tests/e2e/auto-assignments/test-auto-assignments.js  # Run tests', 'cyan');
  } else {
    log('❌ Setup issues found. Please fix the following:', 'red');
    
    if (!allFilesExist) {
      log('• Missing service files (check file paths)', 'red');
    }
    
    if (!configOk) {
      log('• Missing required environment variables', 'red');
      log('  Create .env.local with ASSIGNMENT_QUEUE', 'yellow');
    }
    
    if (!depsOk) {
      log('• Missing dependencies (run npm install)', 'red');
    }
  }
  
  log('\n🔗 Useful Commands:', 'bright');
  log('npm run local                                    # Start development server', 'cyan');
  log('node scripts/check-auto-assignment-setup.js     # Run this check again', 'cyan');
  log('node tests/e2e/auto-assignments/test-auto-assignments.js --quick  # Quick tests', 'cyan');
  
  log(''.padEnd(50, '='), 'cyan');
  
  process.exit(overallStatus ? 0 : 1);
}

// Ejecutar
try {
  main();
} catch (error) {
  log(`💥 Error running setup check: ${error.message}`, 'red');
  process.exit(1);
}
