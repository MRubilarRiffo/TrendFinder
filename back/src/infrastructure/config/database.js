const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { config } = require('./config');

const { db_user, db_password, db_host, db_name, db_port } = config;

const sequelize = new Sequelize(db_name, db_user, db_password, {
	host: db_host,
	port: db_port,
	dialect: 'mysql',
	logging: false,
});

const basename = path.basename(__filename);

const modelDefiners = [];

fs.readdirSync(path.join(__dirname, '/../../models'))
	.filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
	.forEach((file) => {
		modelDefiners.push(require(path.join(__dirname, '/../../models', file)));
	});

	modelDefiners.forEach(model => model(sequelize));

	let entries = Object.entries(sequelize.models);
	let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
	sequelize.models = Object.fromEntries(capsEntries);
	
	const { Product, Stock, Category, Sale, DailySale, WeeklySale, MonthlySale, User, Subscription } = sequelize.models;

	//Relaciones aquí
	Product.hasOne(Stock);
	Stock.belongsTo(Product); // Cada registro de stock pertenece a un único producto

	Product.belongsToMany(Category, { through: 'ProductCategory' });
	Category.belongsToMany(Product, { through: 'ProductCategory' });

	Product.hasMany(Sale); // Un producto puede tener muchas ventas
	Sale.belongsTo(Product); // Cada venta pertenece a un único producto
	
	Product.hasMany(DailySale);
	DailySale.belongsTo(Product);

	Product.hasMany(WeeklySale);
	WeeklySale.belongsTo(Product);

	Product.hasMany(MonthlySale);
	MonthlySale.belongsTo(Product);

	User.hasOne(Subscription);
	Subscription.belongsTo(User);
	
module.exports = {
	...sequelize.models,
	conn: sequelize,
};