// server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const app = express();


// =======================
// CORS CONFIG (VERCEL FIX)
// =======================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {

      // allow Postman / server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);


// handle browser preflight request
app.options("*", cors());


app.use(express.json());



// =======================
// JWT VERIFY
// =======================

const JWKS = createRemoteJWKSet(
  new URL(
    `${process.env.CLIENT_URL || "http://localhost:3000"}/api/auth/jwks`
  )
);


const verifyToken = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }


  const token = authHeader.split(" ")[1];


  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }


  try {

    await jwtVerify(token, JWKS);

    next();

  } catch (error) {

    return res.status(403).json({
      message: "Forbidden"
    });

  }
};




// =======================
// MONGODB CONNECTION
// =======================

let client;
let clientPromise;


function getClient() {

  if (!client) {

    client = new MongoClient(
      process.env.MONGODB_URI,
      {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true
        }
      }
    );


    clientPromise = client.connect();
  }


  return clientPromise;
}





// =======================
// ROUTES
// =======================


app.get("/", (req,res)=>{
  res.send("Server is running...");
});




// get tutors

app.get("/tutors", async(req,res)=>{

  try {

    await getClient();

    const collection =
      client.db("Tutorfinder")
      .collection("Tutors");


    const tutors =
      await collection
      .find()
      .sort({_id:-1})
      .limit(6)
      .toArray();


    res.json(tutors);


  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});





// get tutor by id

app.get("/tutors/:id", async(req,res)=>{


  try {

    await getClient();


    const collection =
      client.db("Tutorfinder")
      .collection("Tutors");


    const tutor =
      await collection.findOne({
        _id:new ObjectId(req.params.id)
      });


    res.json(tutor);


  }catch(error){

    res.status(500).json({
      message:error.message
    });

  }

});






// add tutor protected

app.post(
"/addtutor",
verifyToken,
async(req,res)=>{


try{


await getClient();


const collection =
client.db("Tutorfinder")
.collection("Tutors");


const result =
await collection.insertOne(req.body);



res.json({
 success:true,
 insertedId:result.insertedId
});



}catch(error){


res.status(500).json({
 message:error.message
});


}



});







// add booking

app.post("/bookings", async(req,res)=>{


try{


await getClient();


const collection =
client.db("Tutorfinder")
.collection("Bookings");



const result =
await collection.insertOne(req.body);



res.json(result);



}catch(error){


res.status(500).json({
 message:error.message
});


}


});






// get bookings

app.get("/bookings", async(req,res)=>{


try{


await getClient();



const collection =
client.db("Tutorfinder")
.collection("Bookings");



const bookings =
await collection.find().toArray();



res.json(bookings);



}catch(error){


res.status(500).json({
 message:error.message
});


}



});


// =======================
// VERCEL EXPORT
// =======================


const port = process.env.PORT || 5000;


if(process.env.NODE_ENV !== "production"){

app.listen(port,()=>{
 console.log(
 `Server running on ${port}`
 );
});

}


module.exports = app;