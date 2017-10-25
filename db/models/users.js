/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    password_login: {
      type: DataTypes.CHAR(60),
      allowNull: false
    },
    password_safe: {
      type: DataTypes.CHAR(60),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    last_login: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refer_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    created_at: {
      type: DataTypes.TIME,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.TIME,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.TIME,
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mobile_country: {
      type: DataTypes.CHAR(4),
      allowNull: false
    }
  }, {
    tableName: 'users'
  });
};
