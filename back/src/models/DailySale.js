const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('DailySale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    });
};