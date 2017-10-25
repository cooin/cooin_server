/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('guestBook', {
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
    guestUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    reply: {
      type: DataTypes.STRING,
      allowNull: true
    },
    repliedAt: {
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
    tableName: 'guestBook',
    timestamps: true
  });
};
