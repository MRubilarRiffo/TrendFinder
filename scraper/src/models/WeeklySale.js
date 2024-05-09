const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('WeeklySale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dateStart: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        dateEnd: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    });
};