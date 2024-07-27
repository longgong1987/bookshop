const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let mgDb;

const mongoConnect = (callback) => {

    MongoClient.connect('mongodb+srv://Cluster35452:XWZLb25mb3dW@cluster35452.wud4trz.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster35452')
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

