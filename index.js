require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("Tutorfinder").command({ ping: 1 });




// get all tutors in reverse order
app.get("/tutors", async (req, res) => {
  const tutorsCollection = client.db("Tutorfinder").collection("Tutors");

  const result = await tutorsCollection
    .find()
    .sort({ _id: -1 }) // reverse order
    .limit(6)
    .toArray();

  res.send(result);
});

  

    // Get single tutor by ID
    app.get("/tutors/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const tutorsCollection = client
          .db("Tutorfinder")
          .collection("Tutors");

        const query = { _id: new ObjectId(id) };

        const result = await tutorsCollection.findOne(query);

        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to get tutor",
          error: error.message,
        });
      }
    });


    // add a new tutor
    app.post("/addtutor", async (req, res) => {
      try {
        const tutorData = req.body;

        const tutorsCollection = client
          .db("Tutorfinder")
          .collection("Tutors");

        const result = await tutorsCollection.insertOne(tutorData);

        res.send({
          success: true,
          message: "Tutor added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add tutor",
          error: error.message,
        });
      }
    });


    //post booking data
    app.post("/bookings", async (req, res) => {
      try {
        const bookingData = req.body;

        const bookingsCollection = client.db("Tutorfinder").collection("Bookings");

        const result = await bookingsCollection.insertOne(bookingData);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          message: "Failed to create booking",
          error: error.message,
        });
      }
    });











    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("Server is running...");
});
app.listen(port, () => {
  // console.log(`Server running on port ${port}`);
});