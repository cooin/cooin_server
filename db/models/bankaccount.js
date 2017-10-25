/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bankaccount', {
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
    bankid: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    zhihang: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountnumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    realnameverify: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    inputdate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    isdelete: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    deletetime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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
    tableName: 'bankaccount'
  });
};
