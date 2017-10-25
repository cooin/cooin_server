/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('orderlist', {
    id: {
      type: DataTypes.INTEGER(12),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    currencytype: {
      type: DataTypes.STRING,
      allowNull: false
    },
    depositaddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    depositsource: {
      type: DataTypes.STRING,
      allowNull: false
    },
    alipayrealname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    codea: {
      type: DataTypes.STRING,
      allowNull: false
    },
    codeb: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cash: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    orderdate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderdatedetail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    confirmdate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    usertxt: {
      type: DataTypes.STRING,
      allowNull: false
    },
    admintxt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    total: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    fundinstatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    cancelorder: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: ""
    }
  }, {
    tableName: 'orderlist'
  });
};
