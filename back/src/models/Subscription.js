const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Subscription', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        level: {
            type: DataTypes.ENUM('basic', 'premium', 'ultimate'),
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER, // Duración en meses
            allowNull: false
        },
        dateStart: {
            type: DataTypes.DATE,
            allowNull: false
        },
        dateEnd: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
};