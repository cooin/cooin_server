/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('borrowlist', {
    id: {
      type: DataTypes.INTEGER(12),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    borrowtype: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "1"
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    borrowid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    tradeCount: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    shibiepass: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    rmb_balance: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "0.00"
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
    bt4_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    rmb_balance_f: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "0.00"
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
    bt4_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    borrowcurrencytype: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    period: {
      type: DataTypes.INTEGER(5),
      allowNull: false,
      defaultValue: "0"
    },
    totalborrow: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    nowborrow: {
      type: "DOUBLE",
      allowNull: false
    },
    totalreturn: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    daylilv: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    guartotal: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    guarcurrency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    guartotalbyborrow: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    guarpercent: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    guardeal: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    qiangpinline: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    applydate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    applydateday: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mujideadline: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    returntime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    returntimeforinvest: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    totalprofit: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    moneybackdate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    totallixi: {
      type: "DOUBLE",
      allowNull: true
    },
    profitpercent: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    status: {
      type: DataTypes.INTEGER(2),
      allowNull: true
    },
    sysinput: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    admintxt: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'borrowlist'
  });
};
