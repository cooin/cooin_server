/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('autoInvest', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    timeType: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    autoInvestId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    tradeCount: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    coinType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    totalPeriod: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    nowPeriod: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    withholdDate: {
      type: DataTypes.INTEGER(11),
      allowNull: true
    },
    perAmount: {
      type: "DOUBLE",
      allowNull: false
    },
    nowAmount: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    failureDate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    rmb_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    btc_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    bt2_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    bt3_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    rmb_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    btc_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    bt2_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    bt3_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    redeemCount: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    adjustBalance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
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
    tableName: 'autoInvest',
    timestamps: true
  });
};
