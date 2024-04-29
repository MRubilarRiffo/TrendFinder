const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('MonthlySale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
};