const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 3000
require("dotenv").config()
const jwt = require('jsonwebtoken');
const cookiparser = require('cookie-parser');


app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://alternative-product-11.web.app'
    ],
    credentials: true
}))

app.use(cookiparser())

// app.use(cors())


console.log(process.env.DB_PASS, process.env.DB_USER);


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const recommendProductColection = client.db('defarentproduct').collection('recommendProduct')

        const logger = (req, res, next) => {
            console.log('info', req.method, req.url);
            next()
        }

        const verifyToken = async (req, res, next) => {
            const token = req.cookies?.token
            console.log('cokis', token)
            if (!token) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    console.log(err)
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.user = decoded
                next()
            })
        }

        // const varification = (req, res, next) => {
        //     const token = req.cookies?.token
        //     if (!token) {
        //         return res.status(401).send({ message: 'unauthorized access' })
        //     }
        //     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //         if (err) {
        //             return res.status(401).send({ message: 'unauthorized access' })
        //         }
        //         req.user = decoded;
        //         next();
        //     })
        // }


        // jwt
        //creating Token

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            // console.log("user for token", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10d" });
            // console.log(token);

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            }).send({ success: true });

        });

        //clearing Token
        app.post("/logout", async (req, res) => {
            res.clearCookie('token', {
                maxAge: 0,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
                .send({ success: true })
        });


        app.post('/product', async (req, res) => {
            const data = req.body;
            const result = await mainProductColection.insertOne(data)
            res.send(result)
        })

        // all product

        app.get('/allproduct', async (req, res) => {

            const search = req.query.search
            // console.log('user email', req.query.email);

            // secrch function
            let query = {};
            if (search) query = {
                name: { $regex: search, $options: 'i' }
            };

            const result = await mainProductColection.find(query).toArray();
            res.send(result)
        })


        // spicifai product

        app.get('/product', verifyToken, async (req, res) => {

            console.log(req.user);
            const email = req?.query?.email;
            console.log('user email', req.query.email);
            //  authintication
            if (req?.user?.email !== email) {
                return res.status(403).send({ message: "forbedden access" })
            }
            // email feltaring
            let query = {};
            if (email) {
                query = { "userData.userEmail": email }
            }
            const result = await mainProductColection.find(query).toArray();
            res.send(result)
        })



        // spocifai product get

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await mainProductColection.findOne(query)
            res.send(result)
        })

        // update product
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const data = req.body;
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    name: data.name,
                    brandName: data.brandName,
                    queeryTitle: data.queeryTitle,
                    photourl: data.photourl,
                    text_area: data.text_area,
                    userEmail: data.userData.userEmail,
                    userName: data.userData.userName,
                    namuserPhotoUrle: data.userData.userPhotoUrl,
                    timeAndDate: data.userData.userData,
                }
            }
            const result = await mainProductColection.updateOne(filter, updateDoc, option);
            res.send(result)
        })

        //  delet single product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await mainProductColection.deleteOne(query);
            res.send(result)

        })

        // recommend 
        // recomend add
        app.post('/recommendation', async (req, res) => {
            const data = req.body;
            const result = await recommendProductColection.insertOne(data)
            res.send(result)
        })

        // recomended email get get
        app.get('/recommendation', verifyToken, async (req, res) => {
            const email = req?.query?.email;
            console.log(email, req?.query?.email);
            if (req?.user?.email !== email) {
                return res.status(403).send({ message: "forbedden access" })
            }
            // email filtaring
            let query = {};
            if (email) {
                query = { "userData.userEmail": email }
            }
            const result = await recommendProductColection.find(query).toArray();
            res.send(result)
        })
        //  all recomendaction
        app.get('/recommendationme', async (req, res) => {
            const result = await recommendProductColection.find().toArray();
            res.send(result)
        })
        //  spici fai recomendaction get
        app.get('/recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await recommendProductColection.findOne(query)
            res.send(result)
        })

        // update recomended
        app.patch('/recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const data = req.body;
            const option = { upsert: true }
            const updateDoc = {
                $set: {
                    rtitle: data.rtitle,
                    rproductname: data.rtitle,
                    photourl: data.photourl,
                    text: data.text,
                    timeAndDate: data.timeAndDate,

                }
            }
            const result = await recommendProductColection.updateOne(filter, updateDoc, option);
            res.send(result)
        })

        //  delete recomendaction
        app.delete('/recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendProductColection.deleteOne(query);
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