// require all packages are imported here

// express require
const express = require("express");

// mongodb require
const { MongoClient, ServerApiVersion } = require("mongodb");

// require dotenv
require("dotenv").config();

// create an app with express
const app = express();

// create and app port
const port = process.env.PORT || 5000;

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
