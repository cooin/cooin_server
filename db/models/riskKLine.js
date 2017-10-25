/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('riskKLine', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    time: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    index: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "2"
    },
    createdAt: {
      type: DataTypes.TIME,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.TIME,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    tableName: 'riskKLine'
  });
};
