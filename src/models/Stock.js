const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Stock', {
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });
};