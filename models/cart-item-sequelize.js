const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const CartItem = sequelize.define('cart_item', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    }
})

module.exports = CartItem;