/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('trade', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coinType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    amount: {
      type: "DOUBLE(18,6)",
      allowNull: false,
      defaultValue: "0.000000"
    },
    price: {
      type: "DOUBLE(18,6)",
      allowNull: false,
      defaultValue: "0.000000"
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
    tableName: 'trade',
    timestamps: true
  });
};
