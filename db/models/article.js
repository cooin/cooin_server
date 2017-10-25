/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('article', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cover: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    publishedAt: {
      type: DataTypes.TIME,
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
    tableName: 'article'
  });
};
