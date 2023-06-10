//basedatos.js
const MongoClient = require('mongodb').MongoClient;

const uri = 'mongodb+srv://RCR97:ezInFQqJ5OoOB9uy@hopup.voksoq3.mongodb.net/hopup_productos';
const client = new MongoClient(uri);
let _db;

async function connectDb() {
    if (!_db) {
        await client.connect();
        _db = client.db('hopup_productos');
    }
}

async function getDb() {
    if (!_db) {
        await connectDb();
    }
    return _db;
}

async function getCollection(collectionName) {
    const db = await getDb();
    return db.collection(collectionName);
}

module.exports = { getCollection, connectDb };




