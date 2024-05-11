// require all packages are imported here

// express require
const express = require("express");

// cors require
const cors = require("cors");

// cookie parser require
const cookieParser = require("cookie-parser");

// mongodb require
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// json web token require
const jwt = require("jsonwebtoken");

// require dotenv
require("dotenv").config();

// create an app with express
const app = express();

// middleware for creating routes
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// create and app port
const port = process.env.PORT || 5000;

// create cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// home route content
app.get("/", (req, res) => {
  res.send("Hotel Booking Server is Running. ");
});

// mongodb uri
const uri = process.env.MONGO_DB_URI;

// create mongodb client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// connect mongodb client
const run = async () => {
  try {
    await client.connect();
    // get database of created database
    const hotelsRooms = client.db("RoomsDB").collection("allRoomsData");
    const hotelsUserReviews = client.db("RoomsDB").collection("userReviews");

    // authentication user token route
    app.post("/signin", async (req, res) => {
      const userEmail = req.body;

      // create a token with user email
      const userToken = jwt.sign(userEmail, process.env.USER_SECRET_TOKEN, {
        expiresIn: "20d",
      });
      res
        .cookie("userToken", userToken, cookieOptions)
        .send({ success: "User Sign In Success." });
    });

    // user signout clear cookies
    app.post("/signout", (req, res) => {
      res
        .clearCookie("userToken", { ...cookieOptions, maxAge: 0 })
        .send({ success: "User Signed Out Success." });
    });

    // hotels main routes
    app.get("/rooms", async (req, res) => {
      const result = await hotelsRooms.find().limit(5).toArray();
      res.send(result);
    });

    // room detailes data get
    app.get("/room-detailes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await hotelsRooms.findOne(query);
      res.send(result);
    });

    // user reviews routes
    app.get("/userReviews", async (req, res) => {
      const result = await hotelsUserReviews
        .aggregate([
          {
            $addFields: {
              convertedTimestamp: { $toDate: "$timestamp" },
            },
          },
          {
            $sort: { convertedTimestamp: -1 },
          },
        ])
        .toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
};

run().catch(console.dir);

// my express app listening on port
app.listen(port, () => {
  console.log(`Hotel Booking Server running on port ${port}`);
});
