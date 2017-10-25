/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('todolist', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    todo: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'todolist'
  });
};
