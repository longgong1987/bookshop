const mongodb = require('mongodb');
const getMgDB = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;

const collectionUser = 'users';

class User {
    constructor(username, email, cart, id){
        this.username = username;
        this.email = email;
        this.cart = cart;
        this._id = id;
    }

    save(){
        const db = getMgDB();
        return db.collection(collectionUser).insertOne(this);
    }

    addToCart(product){
        const cartProductIndex = this?.cart?.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });

        let newQuantity = 1;
        const updatedCartItems = this?.cart?.items ? [...this.cart.items] : [];

        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        }else{
            updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQuantity});
        }

        const updatedCart = { items: updatedCartItems};

        const db = getMgDB();
        return db.collection(collectionUser)
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set: {cart: updatedCart}}
            );
    }

    getCart(){
        const db = getMgDB();
        const productIds = this?.cart?.items.map(i => {
            return i.productId;
        });
        return db.collection('products')
            .find({_id: {$in: productIds}})
            .toArray()
            .then(products => {
                // clear cart if product is not available
                if (products.length !== this.cart.items.length) {
                    const updatedCartItems = this.cart.items.filter(item => {
                        return products.find(p => {
                            return p._id.toString() === item.productId.toString();
                        });
                    });
                    const updatedCart = {items: updatedCartItems};
                    db.collection(collectionUser)
                        .updateOne(
                            {_id: new ObjectId(this._id)},
                            {$set: {cart: updatedCart}}
                        );
                }

                return products.map(p => {
                    return {...p, quantity: this.cart.items.find(i => {
                            return i.productId.toString() === p._id.toString();
                        }).quantity
                    };
                });
            })
            .catch(err => {
                console.log(err);
            });
    }

    removeItemFromCart(productId){
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
        const db = getMgDB();
        return db.collection(collectionUser)
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set: {cart: {items: updatedCartItems}}}
            );
    }

    addOrder(){
        const db = getMgDB();
        return this.getCart()
            .then(products => {
                const order = {
                    items: products,
                    user: {
                        _id: new ObjectId(this._id),
                        name: this.username,
                        email: this.email
                    }
                }
                return db.collection('orders').insertOne(order)
            })
            .then(result => {
                this.cart = {items: []};
                return db.collection(collectionUser)
                    .updateOne(
                        {_id: new ObjectId(this._id)},
                        {$set: {cart: {items: []}}}
                    )
            })
            .catch(err => {
                console.log(err);
            });
    }

    getOrder(){
        const db = getMgDB();
        return db.collection('orders').find(
            {'user._id': new ObjectId(this._id)}
        ).toArray();
    }

    static findById(userId){
        const db = getMgDB();
        return db.collection(collectionUser).findOne({_id: new ObjectId(userId)}).then(user => {
            // console.log(user);
            return user;
        })
        .catch(err => {
            console.log(err);
        });
    }
}

// module.exports = User;