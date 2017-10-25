/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('kLine', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "okcoin"
    },
    coinType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    time: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    open: {
      type: "DOUBLE",
      allowNull: false
    },
    close: {
      type: "DOUBLE",
      allowNull: false
    },
    high: {
      type: "DOUBLE",
      allowNull: false
    },
    low: {
      type: "DOUBLE",
      allowNull: false
    },
    vol: {
      type: "DOUBLE(18,6)",
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
    tableName: 'kLine',
    timestamps: true
  });
};
