const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        dropiId: {
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.TEXT,
        },
        description: {
            type: DataTypes.TEXT,
        },
        sale_price: {
            type: DataTypes.DECIMAL(10, 2),
        },
        url: {
            type: DataTypes.STRING,
        },
        country: {
            type: DataTypes.ENUM('Colombia', 'México', 'Panamá', 'Chile', 'Ecuador', 'Perú', 'España'),
            allowNull: false
        },
    });
};