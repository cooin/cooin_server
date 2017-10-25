/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('assetsLog', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    time: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    total: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    rate: {
      type: "DOUBLE(12,6)",
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
    tableName: 'assetsLog',
    timestamps: true
  });
};
