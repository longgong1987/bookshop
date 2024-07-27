const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./util/database');
const Product = require('./models/products');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const errorController = require('./controllers/errors');

// Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to add user to request
app.use((req, res, next) => {
    User.findByPk(1).then(user => {
        req.user = user;
        next();
    }).catch(err => {
        console.log(err);
    });
});

// Group routes
app.use('/admin', adminRoutes.router);
app.use(shopRoutes);

app.use(errorController.get404);

// Define relationships
Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, {through: CartItem});
Product.belongsToMany(Cart, {through: CartItem});
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem});

sequelize
// .sync({force: true})
.sync()
.then(result => {
    return User.findByPk(1);
}).then(user => {
    if (!user){
        return User.create({name: 'ToRo', email: 'toro@toto.com'});
    }
    return user;
})
.then(user => {
    return user.getCart().then(cart => {
        if (!cart){
            return user.createCart();
        }
        return cart;
    });
}).then(cart => {
    // console.log(cart);
    // start server
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});

