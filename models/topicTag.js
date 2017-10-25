/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('topicTag', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
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
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    intro: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    heat: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: "0"
    },
    qqGroup: {
      type: DataTypes.STRING,
      allowNull: true
    },
    whitePaper: {
      type: DataTypes.STRING,
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
    tableName: 'topicTag',
    timestamps: true
  });
};
