/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('chargeAlipay', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    tradeTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    tradeNo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    transMemo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    otherAccountFullname: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    otherAccountEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    tradeAmount: {
      type: "DOUBLE",
      allowNull: true,
      defaultValue: "0"
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: "0"
    },
    chargeRecordId: {
      type: DataTypes.STRING,
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
    tableName: 'chargeAlipay',
    timestamps: true
  });
};
