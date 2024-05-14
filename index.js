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
    origin: [
      "http://localhost:5173",
      "https://blissful-bookings.surge.sh",
      "https://blissful-bookings.web.app",
      "https://blissful-bookings.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// custom middleware
// logger
// const logger = (req, res, next) => {
//   console.log("Logger with: ", req.method, req.url);
//   next();
// };

// verify token
const verifyUserToken = (req, res, next) => {
  const userToken = req.cookies.token;

  if (!userToken) {
    return res.status(401).send({ message: "UnAuthorized!" });
  }
  jwt.verify(userToken, process.env.USER_SECRET_TOKEN, (err, decode) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden!" });
    }
    req.userTokenDecode = decode;
    next();
  });
};

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
    // await client.connect();
    // get database of created database
    const hotelsRooms = client.db("RoomsDB").collection("allRoomsData");
    const hotelsUserReviews = client.db("RoomsDB").collection("userReviews");
    const hotelMyBookings = client.db("RoomsDB").collection("myBookingRooms");

    // // // // // // // // // // // // // // // // //
    // Recheck all routes

    // authentication user token route
    app.post("/signin", async (req, res) => {
      const userEmail = req.body;
      // create a token with user email
      const token = jwt.sign(userEmail, process.env.USER_SECRET_TOKEN, {
        expiresIn: "20d",
      });
      res
        .cookie("token", token, cookieOptions)
        .send({ success: "User Sign In Success." });
    });

    // user signout clear cookies
    app.post("/signout", (req, res) => {
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: "User Signed Out Success." });
    });

    // hotels main routes
    app.get("/rooms", async (req, res) => {
      const options = {
        projection: {
          name: 1,
          description: 1,
          image_url: 1,
          price_per_night: 1,
          available: 1,
        },
      };
      const result = await hotelsRooms.find({}, options).limit(10).toArray();
      res.send(result);
    });

    // get first room data
    app.get("/first-room-banner", async (req, res) => {
      const query = {
        available: true,
      };
      const options = {
        projection: {
          name: 1,
          description: 1,
          image_url: 1,
        },
      };
      const result = await hotelsRooms.findOne(query, options);
      res.send(result);
    });
    // room detailes data get
    app.get("/room-detailes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await hotelsRooms.findOne(query);
      res.send(result);
    });

    // all available room data get
    app.get("/available-rooms", async (req, res) => {
      let query;
      // get price range
      const priceRange = parseInt(req.query.priceRange);

      if (priceRange) {
        query = {
          available: true,
          price_per_night: { $lte: priceRange },
        };
      } else {
        query = {
          available: true,
        };
      }

      const options = {
        projection: {
          name: 1,
          description: 1,
          image_url: 1,
          price_per_night: 1,
          available: 1,
        },
      };
      const result = await hotelsRooms.find(query, options).toArray();
      res.send(result);
    });

    // room booked in another collection
    app.post("/my-booking", async (req, res) => {
      let bookedData = req.body;
      const result = await hotelMyBookings.insertOne(bookedData);
      res.send(result);
    });

    app.delete("/my-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await hotelMyBookings.deleteOne(query);
      res.send(result);
    });

    // get my booked data
    app.get("/my-booking-room", verifyUserToken, async (req, res) => {
      if (req.query?.email !== req.userTokenDecode.email) {
        return res.status(403).send({ message: "Forbiden!" });
      }
      const query = { userEmail: req.query.email };
      const result = await hotelMyBookings.find(query).toArray();
      res.send(result);
    });

    // update booked date
    app.patch("/update-booked-date/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: {
          bookingDate: updateData.bookingDate,
        },
      };
      const result = await hotelMyBookings.updateOne(query, updatedData);
      res.send(result);
    });

    // booked room available update after room booked success
    app.patch("/update-booking-available/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedData = {
        $set: {
          available: updateData.available,
        },
      };
      const result = await hotelsRooms.updateOne(query, updatedData);
      res.send(result);
    });

    // room review get
    app.get("/room-review", async (req, res) => {
      const result = await hotelsUserReviews.find().toArray();
      res.send(result);
    });

    // room review post
    app.post("/room-review", async (req, res) => {
      const reviewData = req.body;
      const result = await hotelsUserReviews.insertOne(reviewData);
      res.send(result);
    });

    app.get("/room-review-count/:id", async (req, res) => {
      const id = req.params.id;
      const query = { mainRoomId: id };
      const result = await hotelsUserReviews.find(query).toArray();
      res.send(result);
    });
    // gallery page all room data get
    app.get("/gallery", async (req, res) => {
      const options = {
        projection: {
          name: 1,
          description: 1,
          image_url: 1,
          amenities: 1,
        },
      };
      const result = await hotelsRooms.find({}, options).toArray();
      res.send(result);
    });
    // // // // // // // // // // // // // // // // //

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
