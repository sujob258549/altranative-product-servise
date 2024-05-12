const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3000
require("dotenv").config()


app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}))

// app.use(cors())


console.log(process.env.DB_PASS, process.env.DB_USER);


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.aasa6jh.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

// const uri = "mongodb+srv://assinment-11-defarent-product:jgFEqTjSFoh9jleD@atlascluster.aasa6jh.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const mainProductColection = client.db('defarentproduct').collection('mainproduct')

        app.post('/product', async (req, res) => {
            const data = req.body;
            const result = await mainProductColection.insertOne(data)
            res.send(result)
        })




        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Defrent product!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})