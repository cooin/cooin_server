/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('followInvest', {
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
    leaderId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    followInvestId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    tradeCount: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    rmb_balance: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "0.00"
    },
    rmb_balance_f: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "0.00"
    },
    initialBalance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    rechargeBalance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitLimit: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    lossLimit: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
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
    tableName: 'followInvest'
  });
};
