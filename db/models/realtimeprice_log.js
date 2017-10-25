/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('realtimeprice_log', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    currencytype: {
      type: DataTypes.INTEGER(6),
      allowNull: false,
      defaultValue: "0"
    },
    syndate: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    lastprice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: "0"
    },
    buy: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    sell: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    low: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    high: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    vol: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    isManual: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: "0"
    },
    adjustBalance: {
      type: DataTypes.FLOAT,
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
    tableName: 'realtimeprice_log'
  });
};
