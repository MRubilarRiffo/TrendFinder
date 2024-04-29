const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('DailySale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
};