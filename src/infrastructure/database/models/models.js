// Este archivo instancia y exporta los modelos Sequelize para toda la app
const { Sequelize } = require('sequelize');
const config = require('../../config');
const defineModels = require('./index').defineModels;

// Instancia Sequelize usando los parámetros y el dialecto
const sequelize = new Sequelize(
	config.database.name,
	config.database.user,
	config.database.password,
	{
		host: config.database.host,
		port: config.database.port,
		dialect: 'mssql',
		logging: false
	}
);

// Instancia los modelos
const models = defineModels(sequelize);

module.exports = models;
