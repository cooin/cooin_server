/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('admin_userOperationLog', {
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
    api: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payload: {
      type: DataTypes.TEXT,
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
    tableName: 'admin_userOperationLog',
    timestamps: true
  });
};
