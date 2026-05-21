require("dotenv").config();
const express = require("express");
const app = express();
const { ObjectId } = require("mongodb");

// middleware
app.use(express.json());

// MongoDB connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Run function to handle DB
async function run() {
  try {
    await client.connect();
    await client.db("Tutorfinder").command({ ping: 1 });

    // Get all tutors
    app.get("/tutors", async (req, res) => {
      const tutorsCollection = client.db("Tutorfinder").collection("Tutors");

      const result = await tutorsCollection
        .find()
        .sort({ _id: -1 })
        .limit(6)
        .toArray();

      res.json(result);
    });

    // Get single tutor by ID
    app.get("/tutors/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const tutorsCollection = client.db("Tutorfinder").collection("Tutors");
        const result = await tutorsCollection.findOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to get tutor", error: error.message });
      }
    });

    // Add a new tutor
    app.post("/addtutor", async (req, res) => {
      try {
        const tutorData = req.body;
        const tutorsCollection = client.db("Tutorfinder").collection("Tutors");
        const result = await tutorsCollection.insertOne(tutorData);
        res.json({ success: true, message: "Tutor added successfully", insertedId: result.insertedId });
      } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add tutor", error: error.message });
      }
    });

    // Post booking data
    app.post("/bookings", async (req, res) => {
      try {
        const bookingData = req.body;
        const bookingsCollection = client.db("Tutorfinder").collection("Bookings");
        const result = await bookingsCollection.insertOne(bookingData);
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to create booking", error: error.message });
      }
    });

  } finally {
    // Do not close client here—serverless keeps it alive
  }
}
run().catch(console.dir);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Export app for Vercel serverless
module.exports = app;