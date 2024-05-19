const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('CountSale', {
        repeat: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        totalSales: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });
};