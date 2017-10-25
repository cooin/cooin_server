/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('countproblem', {
    id: {
      type: DataTypes.INTEGER(8),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    count: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    baozhenupdatedate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    switchsell3: {
      type: DataTypes.STRING,
      allowNull: false
    },
    switchfreeexp: {
      type: DataTypes.STRING,
      allowNull: false
    },
    voicecode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    genindexdate: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'countproblem'
  });
};
