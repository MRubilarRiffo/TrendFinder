const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Sale', {
        unitsSold: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
};