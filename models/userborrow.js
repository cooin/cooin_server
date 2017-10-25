/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('userborrow', {
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
    borrowid: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: "0"
    },
    curr_type: {
      type: DataTypes.INTEGER(5),
      allowNull: false,
      defaultValue: "0"
    },
    totalborrow: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    alreadyreturn: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    totalshouxufei: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    alreadyshouxufei: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    lilv: {
      type: "DOUBLE",
      allowNull: false,
      defaultValue: "0"
    },
    lastshouxufeiupdate: {
      type: DataTypes.STRING,
      allowNull: false
    },
    applydate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    applydatedetail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    hmanytimesreturn: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      defaultValue: "0"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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
    tableName: 'userborrow',
    timestamps: true
  });
};
