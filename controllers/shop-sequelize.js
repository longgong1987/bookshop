const Product = require('../models/products');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
    Product.findAll().then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products',
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
    const productId = parseInt(req.params.productId, 10);
    Product.findByPk(productId).then((product) => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getIndex = (req, res, next) => {
    Product.findAll().then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/shop',
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getCart = (req, res, next) => {
    req.user.getCart()
    .then(cart => {
        return cart.getProducts().then(products => {
            res.render('shop/cart', {
                pageTitle: 'Your Cart',
                path: '/cart',
                products: products,
            });
        }).catch(err => {
            console.log(err)
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.postCart = (req, res, next) => {
    const productId = parseInt(req.body.productId, 10);
    let fetchedCart;
    let newQuantity = 1;

    req.user.getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts({where: {id: productId}});
        })
        .then(products => {
            let product;
            if (products.length > 0){
                product = products[0];
            }
            if (product) {
                const oldQuantity = product.cart_item.quantity;
                newQuantity = oldQuantity + 1;
                return product;
            }
            return Product.findByPk(productId)
        })
        .then(product => {
            return fetchedCart.addProduct(product, {
                through: {quantity: newQuantity},
            });
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        });
    
}

exports.postCartDeleteProduct = (req, res, next) => {
    const productId = parseInt(req.body.productId, 10);
    req.user
    .getCart()
    .then(cart => {
        return cart.getProducts({where: {id: productId}});
    })
    .then(products => {
        const product = products[0];
        return product.cart_item.destroy();
    })
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        console.log(err);
    });
    Product.findByPk(productId, (product) => {
        // console.log(product.price);
        Cart.deleteProduct(productId, product.price);
        res.redirect('/cart');
    });
    
}

exports.postOrder = (req, res, next) => {
    let fetchedCart;
    req.user.getCart().then(cart => {
        fetchedCart = cart;
        return cart.getProducts();
    })
    .then(products => {
        return req.user.createOrder()
        .then(order => {
            return order.addProducts(products.map(product => {
                product.order_item = {quantity: product.cart_item.quantity};
                return product;
            }));
        })
        .catch(err => {
            console.log(err);
        });
    })
    .then(result => {
        return fetchedCart.setProducts(null);
    })
    .then(result => {
        res.redirect('/orders');
    })
    .catch(err => {
        console.log(err);
    });
};

exports.getOrders = (req, res, next) => {
    req.user
        .getOrders({include: ['products']})
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders',
                path: '/orders',
                orders: orders,
            });
        })
        .catch(err => {
            console.log(err);
        });
    
};