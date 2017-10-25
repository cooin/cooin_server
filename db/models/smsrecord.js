/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('smsrecord', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startdate: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    detaildate: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    tel: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    smscate: {
      type: DataTypes.INTEGER(2),
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    used: {
      type: DataTypes.INTEGER(2),
      allowNull: false,
      defaultValue: "0"
    },
    inputerrortimes: {
      type: DataTypes.INTEGER(2),
      allowNull: true
    }
  }, {
    tableName: 'smsrecord'
  });
};
