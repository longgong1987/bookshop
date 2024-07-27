require('dotenv').config()
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let mgDb;

const mongoConnect = (callback) => {

    MongoClient.connect(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster35452.wud4trz.mongodb.net/${process.env.MONGODB_COLLECTION_NAME}?retryWrites=true&w=majority&appName=${process.env.MONGODB_APPNAME}`)
    .then(client => {
        console.log('MongoDB Connected!');
        mgDb = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    })

}

const getDb = () => {
    if (mgDb) {
        return mgDb;
    }
    return 'No Database Found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

