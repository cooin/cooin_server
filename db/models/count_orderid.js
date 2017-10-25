/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('count_orderid', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    count: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    }
  }, {
    tableName: 'count_orderid'
  });
};
