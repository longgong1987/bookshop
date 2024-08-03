const { validationResult } = require('express-validator');
const Product = require('../models/products');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const description = req.body.description;
    const price = req.body.price;
    
    if (!image){
        console.log('No image provided');
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                description: description,
                price: price,
            },
            errorMessage: 'Attached file is not an image',
            validationErrors: [],
        });
    }

    const imageUrl = image.path;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                description: description,
                price: price,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user,
    });

    product
    .save()
    .then(result => {
        console.log('Product Created');
        res.redirect('/admin/products');
    })
    .catch(err => {
        // res.redirect('/500');
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    
};

exports.getProducts = (req, res, next) => {
    Product.find({
        userId: req.user._id
    })
    // .select('title price imageUrl description -_id')
    // .populate('userId', 'name')
    .then(products => {
        // console.log(products);
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',

        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const productId = req.params.productId;
    Product.findById(productId)
    .then((product) => {
        if (!product) {
            return res.redirect('/');
        }
        return res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            hasError: false,
            errorMessage: null,
            validationErrors: [],
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {

    const productId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;
    const image = req.file;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                _id: productId,
                title: updatedTitle,
                description: updatedDescription,
                price: updatedPrice,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    Product.findById(productId)
    .then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        if(image){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }
        product.description = updatedDescription;
        return product.save().then(result => {
            console.log('Product Updated!');
            res.redirect('/admin/products');
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.deleteProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
    .then(product => {
        if (!product) {
            return next(new Error('Product not found.'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id:  productId, userId: req.user._id});
    })
    .then(() => {
        console.log('Product Deleted');
        res.status(200).json({
            message: 'Success!'
        });
    })
    .catch(err => {
        // const error = new Error(err);
        // error.httpStatusCode = 500;
        // return next(error);
        res.status(500).json({
            message: 'Deleting product failed.'
        });
    });
};