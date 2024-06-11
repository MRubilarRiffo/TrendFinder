const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Token', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });
};