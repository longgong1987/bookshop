const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');
const Product = require('../models/products');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems = 0;

    Product.countDocuments()
    .then(productCount => {
        totalItems = productCount;
        return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
    }).then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems = 0;

    Product.countDocuments()
    .then(productCount => {
        totalItems = productCount;
        return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
    .then((product) => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {
        // console.log(user.cart.items);
        const products = user.cart.items;
        res.render('shop/cart', {
            pageTitle: 'Your Cart',
            path: '/cart',
            products: products,
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    // console.log(productId)
    Product.findById(productId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postCartDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    req.user
    .removeFromCart(productId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
    .populate('cart.items.productId')
    .then(user => {
        
        products = user.cart.items;
        total = 0;
        products.forEach(product => {
            total += product.quantity * product.productId.price;
        });

        return stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: products.map(p => {
                return {
                    price_data: {
                        currency: process.env.PAYMENT_CURRENCY,
                        unit_amount: p.productId.price * 100,
                        product_data: {
                          name: p.productId.title,
                          description: p.productId.description,
                        },
                    },
                    quantity: p.quantity
                  };
            }),
            mode: process.env.PAYMENT_MODE,
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
            cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        });
       
    })
    .then(session => {
        // console.log(session);
        res.render('shop/checkout', {
            pageTitle: 'Checkout',
            path: '/checkout',
            products: products,
            totalSum: total,
            sessionId: session.id
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {
        // console.log(user.cart.items);
        const products = user.cart.items.map(i => {
            return {quantity: i.quantity, product: { ...i.productId._doc }};
        });

        const orders = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products
        });
        return orders.save();
    })
    .then(result => {
        return req.user.clearCart();
    })
    .then(result => {
        res.redirect('/orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id}).then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders: orders,
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order.findById(orderId)
    .then(order => {
        if(!order){
            return next(new Error('No order found.'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        // Create PDF by using PDFKit
        const pdfDoc = new PDFDocument();
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {
            underline: true
        });
        pdfDoc.fontSize(20).text('----------------------------------------');
        let totalPrice = 0;
        order.products.forEach(item => {
            totalPrice += item.quantity * item.product.price;
            pdfDoc.fontSize(14).text(
                item.product.title + ' - ' + item.quantity + ' x ' + '$' + item.product.price
            );
        });

        pdfDoc.fontSize(20).text('----------------------------------------');
        pdfDoc.text('Total Price: $' + totalPrice);
        pdfDoc.end();

        // Read file data
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
        //     res.send(data);
        // });

        // Stream data
        // const file = fs.createReadStream(invoicePath)
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
        // file.pipe(res);
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};