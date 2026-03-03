const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('SalesSnapshot', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        ProductId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        periodDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isIn: [[1, 7, 30]]
            }
        },
        totalQuantitySold: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        totalProfit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        calculatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    });
};