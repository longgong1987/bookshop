const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    'node_complete',
    'root',
    'Lrt7R99GFNFQ',
    {
        dialect: 'mysql',
        host: 'localhost'
    }
);

module.exports = sequelize;