// server.js
require("dotenv").config();
const express = require("express");

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(express.json());
const cors = require('cors');
app.use(cors());

// Global client for serverless reuse
let client;
let clientPromise;

function getClient() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    clientPromise = client.connect();
    
  }
  return clientPromise;
}

// Root route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Get all tutors
app.get("/tutors", async (req, res) => {
  try {
    await getClient();
    const tutorsCollection = client.db("Tutorfinder").collection("Tutors");
    const tutors = await tutorsCollection.find().sort({ _id: -1 }).limit(6).toArray();
    res.json(tutors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tutor by ID
app.get("/tutors/:id", async (req, res) => {
  try {
    await getClient();
    const tutorsCollection = client.db("Tutorfinder").collection("Tutors");
    const tutor = await tutorsCollection.findOne({ _id: new ObjectId(req.params.id) });
    res.json(tutor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add tutor
app.post("/addtutor", async (req, res) => {
  try {
    await getClient();
    const tutorsCollection = client.db("Tutorfinder").collection("Tutors");
    const result = await tutorsCollection.insertOne(req.body);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add booking
app.post("/bookings", async (req, res) => {
  try {
    await getClient();
    const bookingsCollection = client.db("Tutorfinder").collection("Bookings");
    const result = await bookingsCollection.insertOne(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});

module.exports = app;