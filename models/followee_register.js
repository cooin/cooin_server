/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('followee_register', {
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
    fundname: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    rmb: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    btc: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    bt2: {
      type: "DOUBLE",
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
    tableName: 'followee_register',
    timestamps: true
  });
};
