const express = require('express');
const isAuth = require('../middleware/is-auth');

const adminController = require('../controllers/admin');

const router = express.Router();

const product = [];

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, adminController.postAddProduct);

// /admin/edit-product => GET
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit-product => POST
router.post('/edit-product', isAuth, adminController.postEditProduct);

// // /admin/delete-product => POST
router.post('/delete-product', isAuth, adminController.postDeleteProduct);


exports.router = router;
exports.product = product;