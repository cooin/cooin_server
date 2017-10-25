/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('question', {
    id: {
      type: DataTypes.INTEGER(9),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    pass: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    questiontxt: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    realname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    cate: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: ""
    },
    subcate: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: ""
    },
    joindate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    orderid: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    problemid: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    zhuangtai: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: "0"
    },
    ask: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: ""
    },
    answerdate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    adminuser: {
      type: DataTypes.STRING,
      allowNull: false
    },
    review: {
      type: DataTypes.INTEGER(2),
      allowNull: false
    }
  }, {
    tableName: 'question'
  });
};
