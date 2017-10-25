/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('su_sellcategory', {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    catename: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    class1: {
      type: DataTypes.INTEGER(50),
      allowNull: false,
      defaultValue: "0"
    },
    class2: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      defaultValue: "0"
    },
    class3: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      defaultValue: "0"
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    faqtxt: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'su_sellcategory'
  });
};
