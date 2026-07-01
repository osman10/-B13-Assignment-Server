// server.js
require("dotenv").config();
const express = require("express");

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const cors = require("cors");
app.use(cors());
app.use(express.json());


// JWT token verify
const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        // console.log(payload);
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" });
    }
};



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

// Get tutors
app.get("/tutors",  async (req, res) => {
  try {
    await getClient();

    const tutorsCollection = client
      .db("Tutorfinder")
      .collection("Tutors");

    const tutors = await tutorsCollection
      .find()
      .sort({ _id: -1 })
      .limit(6)
      .toArray();

    res.json(tutors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single tutor by ID
app.get("/tutors/:id", verifyToken, async (req, res) => {
  try {
    await getClient();

    const tutorsCollection = client
      .db("Tutorfinder")
      .collection("Tutors");

    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid tutor id",
      });
    }

    const tutor = await tutorsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!tutor) {
      return res.status(404).json({
        message: "Tutor not found",
      });
    }

    res.status(200).json(tutor);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// Get tutors by userId;
app.get("/tutors/user/:userId",verifyToken, async (req, res) => {
  try {
    await getClient();

    const tutorsCollection = client
      .db("Tutorfinder")
      .collection("Tutors");

    const { userId } = req.params;

    const tutors = await tutorsCollection
      .find({ userId })
      .toArray();

    res.status(200).json(tutors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Delete tutor by ID
app.delete("/tutors/:id", verifyToken, async (req, res) => {
  try {
    await getClient();

    const tutorsCollection = client
      .db("Tutorfinder")
      .collection("Tutors");

    const { id } = req.params;

    console.log("Delete ID:", id);


    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid tutor id",
      });
    }


    const result = await tutorsCollection.deleteOne({
      _id: new ObjectId(id),
    });


    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Tutor not found",
      });
    }


    res.status(200).json({
      message: "Tutor deleted successfully",
    });


  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// Update tutor by ID
app.patch("/tutors/:id", verifyToken, async (req, res) => {
  try {
    await getClient();

    const tutorsCollection = client
      .db("Tutorfinder")
      .collection("Tutors");

    const { id } = req.params;
    const updatedData = req.body;


    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid tutor id",
      });
    }


    const result = await tutorsCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          TutorName: updatedData.TutorName,
          PhotoURL: updatedData.PhotoURL,
          Subject: updatedData.Subject,
          HourlyFee: Number(updatedData.HourlyFee),
          TotalSlots: Number(updatedData.TotalSlots),
          Available: updatedData.Available,
          SessionStartDate: updatedData.SessionStartDate,
          SessionEndDate: updatedData.SessionEndDate,
          Institution: updatedData.Institution,
          Experience: updatedData.Experience,
          Location: updatedData.Location,
          TeachingMode: updatedData.TeachingMode,
          Description: updatedData.Description,
        },
      }
    );


    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Tutor not found",
      });
    }


    res.status(200).json({
      message: "Tutor updated successfully",
      result,
    });


  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// Add tutor
app.post("/addtutor", verifyToken, async (req, res) => {
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
app.post("/bookings", verifyToken, async (req, res) => {
  try {
    await getClient();
    const bookingsCollection = client.db("Tutorfinder").collection("Bookings");
    const result = await bookingsCollection.insertOne(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get all bookings 
app.get("/bookings", verifyToken, async (req, res) => {
  try {
    await getClient();
    const bookingsCollection = client.db("Tutorfinder").collection("Bookings");
    const bookings = await bookingsCollection.find().toArray();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get bookings by userId
app.get("/bookings/:userId", verifyToken, async (req, res) => {
  try {
    await getClient();

    const { userId } = req.params;

    const bookingsCollection = client
      .db("Tutorfinder")
      .collection("Bookings");

    const bookings = await bookingsCollection
      .find({ userId })
      .toArray();

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// update booking status by ID
app.patch("/bookings/:id", verifyToken, async (req, res) => {
  try {
    await getClient();

    const { id } = req.params;
    const { status } = req.body;

    const bookingsCollection = client
      .db("Tutorfinder")
      .collection("Bookings");


    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
        },
      }
    );


    if (result.modifiedCount === 0) {
      return res.status(404).json({
        message: "Booking not found or already updated",
      });
    }


    res.status(200).json({
      message: "Booking updated successfully",
      result,
    });


  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});









const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;