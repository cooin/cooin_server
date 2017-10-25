/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('orderlist_bid_log', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    transNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    transType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coinType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sellOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    buyOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    quantity: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    transPrice: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    total: {
      type: "DOUBLE",
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
    tableName: 'orderlist_bid_log'
  });
};
