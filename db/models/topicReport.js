/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topicReport', {
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
    rootId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    topicId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    status: {
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
    tableName: 'topicReport'
  });
};
