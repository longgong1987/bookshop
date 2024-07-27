require('dotenv').config()
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    process.env.SEQUELIZE_DATABASE,
    process.env.SEQUELIZE_USER,
    process.env.SEQUELIZE_PASSWORD,
    {
        dialect: 'mysql',
        host: 'localhost'
    }
);

module.exports = sequelize;