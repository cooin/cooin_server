/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('activityCode', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ""
    },
    openid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    inviterOpenid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "1"
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    awardAmount: {
      type: "DOUBLE",
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: "0"
    },
    receivedAt: {
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
    tableName: 'activityCode'
  });
};
