const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
require('dotenv').config();

const app = express();

// middleware
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kvqywrf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('usedMobileGallery').collection('categories');
        const productsCollection = client.db('usedMobileGallery').collection('products');
        const bookingsCollection = client.db('usedMobileGallery').collection('bookings');
        const usersCollection = client.db('usedMobileGallery').collection('users');



        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const products = await productsCollection.findOne(query);
            res.send(products)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const category = await productsCollection.find(query).toArray();
            res.send(category);
        })

        // post booking data to server
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        // get bookings data
        app.get('/bookings', async (req, res) => {
            const email = req.query.buyerEmail;
            // console.log(email);
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);

        })

        // post users to database
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);

        })

    }
    finally {

    }

}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('UMG Mart is running')
})

app.listen(port, () => console.log(`UMG Mart running on ${port}`))
