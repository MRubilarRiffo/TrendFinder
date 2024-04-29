const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('WeeklySale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
};