const mongodb = require('mongodb');
const getMgDB = require('../util/database').getDb;

const collectionName = 'products';

class Product {
    constructor(title, price, imageUrl, description, id, userId) {
        this.title = title;
        this.price = price;
        this.imageUrl = imageUrl;
        this.description = description;
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.userId = userId;
    }

    save() {
        const db = getMgDB();
        
        let dbOp;
        if (this._id) {
            dbOp = db.collection(collectionName).updateOne({
                _id: this._id,
            },
            {
                $set: {
                    title: this.title,
                    price: this.price,
                    imageUrl: this.imageUrl,
                    description: this.description,
                }
            });
        }else{
            dbOp = db.collection(collectionName).insertOne(this);
        }
        return dbOp.then(result => {
            console.log(result);
        })
        .catch(err => {
            console.log(err);
        });
    }

    static fetchAll() {
        const db = getMgDB();
        return db.collection(collectionName)
            .find()
            .toArray()
            .then(products => {
                console.log(products);
                return products;
            })
            .catch(err => {
                console.log(err);
            });
    }

    static findById(productId) {
        const db = getMgDB();
        return db.collection(collectionName)
            .find({_id: new mongodb.ObjectId(productId)})
            .next()
            .then(product => {
                console.log(product);
                return product;
            })
            .catch(err => {
                console.log(err);
            });

    }
    
    static deleteById(productId){
        const db = getMgDB();
        return db.collection(collectionName)
        .deleteOne({_id: new mongodb.ObjectId(productId)})
        .then(result => {
            console.log('Product Deleted');
        })
        .catch(err => {
            console.log(err);
        });

    }
}

// module.exports = Product;