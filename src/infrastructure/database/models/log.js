const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    meta: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    user: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    service: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'logs',
    timestamps: false
  });

  return Log;
};
