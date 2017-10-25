/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transBonusLog', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    amount: {
      type: "DOUBLE",
      allowNull: false
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
    tableName: 'transBonusLog'
  });
};
