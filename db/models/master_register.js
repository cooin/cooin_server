/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('master_register', {
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
    activecode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    tradeCount: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    dealpassword: {
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
    shibiepass: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    realname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    countrycode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tel: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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
    country: {
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
    homeaddress: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    drawstate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    drawcity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    ipcity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    idcard: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    refer: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    referbonuspaid: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    joindate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    paymode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bankname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    alipay: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    btc_address: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bt2_address: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bt2_address_id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "1"
    },
    bt3_address: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bt4_address: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    bt4_balance_f: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    score: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    banknumber: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    zhihang: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    paycomment: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    promotecode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    cancelmember: {
      type: DataTypes.INTEGER(5),
      allowNull: false,
      defaultValue: "0"
    },
    bt4_balance: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    allincome: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    withdrawinfo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    experienced: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    investmember: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: "0"
    },
    regip: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    regallinfo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    refertxt: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    allpay: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    alldraw: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    allwin: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    allconsume: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    shouldreturn: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    onlinesupport: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    allrefer: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      defaultValue: "0"
    },
    allreferfund: {
      type: DataTypes.INTEGER(9),
      allowNull: false,
      defaultValue: "0"
    },
    allorder: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      defaultValue: "0"
    },
    totaldeal: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    totalborrow: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    totalinvestwin: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    lastdealdate: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    howmanydeal: {
      type: DataTypes.INTEGER(4),
      allowNull: true
    },
    lastlogintime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    frozedata: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    getbackpasstime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    sysinput: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    switchdealpass: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    adminlimit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    openid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subscribe: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    nickname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    intro: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    riskIndex: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "2"
    },
    followCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    fansCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    followInvestCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    fansInvestCount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    toplimitForLeadBalance: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "50000.00"
    },
    managedBalance: {
      type: "DOUBLE(12,2)",
      allowNull: false,
      defaultValue: "0.00"
    },
    commissionRate: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: "0.1"
    },
    profitRateFor1Day: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitRateFor1Week: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitRateFor1Month: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitRateFor3Month: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitRateFor6Month: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    profitRateFor1Year: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    tradedExchanges: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tradedCoins: {
      type: DataTypes.STRING,
      allowNull: true
    },
    averageForHoldDay: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    riskFor1Week: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "2"
    },
    riskFor1Month: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "2"
    },
    riskFor1Year: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "2"
    }
  }, {
    tableName: 'master_register'
  });
};
