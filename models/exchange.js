/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('exchange', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    name_cn: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    cover: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    intro: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    leaderCount: {
      type: DataTypes.INTEGER(11),
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
    tableName: 'exchange',
    timestamps: true
  });
};
