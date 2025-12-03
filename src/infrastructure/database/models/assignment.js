const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Assignment = sequelize.define('Assignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id'
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date'
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'assigned_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    // Nuevos campos
    ProcessId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ProcessId'
    },
    Source: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'Source'
    },
    DocumentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'DocumentNumber'
    },
    InvoiceAmount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: 'InvoiceAmount'
    },
    ExternalReference: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ExternalReference'
    },
    ClaimId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ClaimId'
    },
    ConceptApplicationCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ConceptApplicationCode'
    },
    ObjectionCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'ObjectionCode'
    },
    Value: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      field: 'Value'
    }
  }, {
    tableName: 'assignments',
    timestamps: true
  });

  return Assignment;
};
