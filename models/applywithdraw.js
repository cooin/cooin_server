/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('applywithdraw', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    applypayid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    currencytype: {
      type: DataTypes.INTEGER(5),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    applydate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    money: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    shouxu: {
      type: "DOUBLE",
      allowNull: false
    },
    shiji: {
      type: "DOUBLE",
      allowNull: false
    },
    rcashname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    paymode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    payinfo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    usercomment: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    pay: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    paydate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    ipaddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    admintxt: {
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
    tableName: 'applywithdraw',
    timestamps: true
  });
};
