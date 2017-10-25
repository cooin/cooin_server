/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('fund_in_out', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    transNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    fundmoneystatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    curr_type: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    },
    addorminus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    actiondate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    paymode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    borrowid: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    price: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    quantity: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    money: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    playuser: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderid: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    admintxt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    valuedate: {
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
    tableName: 'fund_in_out'
  });
};
