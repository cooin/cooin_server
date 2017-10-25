/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('orderlist_bid', {
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
    followUsername: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tradePlatform: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    followOrderid: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    buyOrderid: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    sellRMBBalance: {
      type: "DOUBLE(12,2)",
      allowNull: true
    },
    coinBalance: {
      type: "DOUBLE(18,6)",
      allowNull: true
    },
    coinBalance_f: {
      type: "DOUBLE(18,6)",
      allowNull: true
    },
    profitRate: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    profitForLeader: {
      type: "DOUBLE(12,2)",
      allowNull: true
    },
    commissionRate: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    bors: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: ""
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
    curr_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    moneyfrom: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    borrowid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    bidprice: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    quantity: {
      type: "DOUBLE(18,6)",
      allowNull: false,
      defaultValue: "0.000000"
    },
    nowquantity: {
      type: "DOUBLE(18,6)",
      allowNull: false,
      defaultValue: "0.000000"
    },
    total: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    nowdealtotal: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    status: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    feebonus: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    valuedate: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    cancelorder: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: ""
    },
    canceldate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    admintxt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    sysinput: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    isMarket: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    isMatched: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: "0"
    },
    isRobot: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    expiredAt: {
      type: DataTypes.TIME,
      allowNull: true
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
    tableName: 'orderlist_bid'
  });
};
