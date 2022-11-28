const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

// middleware
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kvqywrf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// // jwt function
function verifyJWT(req, res, next) {
    console.log("token inside VerifyJWT", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send('Unauthorized Access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

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
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log('token', req.headers.authorization);

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { buyerEmail: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);

        })

        // get jwt token 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '2d' })
                return res.send({ accessToken: token });
            }
            console.log(user);
            res.status(403).send({ accessToken: '' });
        })

        // post users to database
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);

        });

        // // put admin role to user data
        app.put('/users/admin/:id',verifyJWT, async (req, res) => {
          
            const decodedEmail=req.decoded.email;
            const query = {email: decodedEmail};
            const user = usersCollection.findOne(query);
            if(user?.userType !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    userType: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, option)
            res.send(result)
        });


        // get user data from database
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
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
