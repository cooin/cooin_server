/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('realtimeprice', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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
      allowNull: false,
      defaultValue: "0"
    },
    sell: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: "0"
    },
    low: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: "0"
    },
    high: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: "0"
    },
    vol: {
      type: DataTypes.FLOAT,
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
    tableName: 'realtimeprice',
    timestamps: true
  });
};
