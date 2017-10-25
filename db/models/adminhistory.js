/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('adminhistory', {
    id: {
      type: DataTypes.INTEGER(12),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    adminusername: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderidmask: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    optype: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    actiondate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    money: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    playuser: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    admintxt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    agree: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    }
  }, {
    tableName: 'adminhistory'
  });
};
