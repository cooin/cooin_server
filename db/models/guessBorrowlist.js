/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('guessBorrowlist', {
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
    period: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    amount: {
      type: "DOUBLE",
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    isWin: {
      type: DataTypes.INTEGER(1),
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
    tableName: 'guessBorrowlist'
  });
};
