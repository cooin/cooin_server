/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('faqinput', {
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
    faqtxt: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'faqinput'
  });
};
