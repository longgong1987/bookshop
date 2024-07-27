const Product = require('../models/products');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;
    const price = req.body.price;

    req.user.createProduct({
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description,
        userId: req.user.id,
    }).then(result => {
        console.log('Product Created');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
    
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const productId = parseInt(req.params.productId, 10);
    req.user.getProducts({where: {id: productId}})
    .then((products) => {
        const product = products[0]
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {

    const productId = parseInt(req.body.productId, 10);
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;

    req.user.getProducts({where: {id: productId}})
    .then(products => {
        const product = products[0];
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.imageUrl = updatedImageUrl;
        product.description = updatedDescription;
        return product.save();
    }).then(result => {
        console.log('Product Updated');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
}

exports.getProducts = (req, res, next) => {
    req.user.getProducts()
    .then(products => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
    const productId = parseInt(req.body.productId, 10);
    req.user.getProducts({where: {id: productId}})
    .then(products => {
        const product = products[0];
        return product.destroy();
    })
    .then(result => {
        console.log('Product Deleted');
        res.redirect('/admin/products');
    })
    .catch(err => {
        console.log(err);
    });
};