// require all packages are imported here

// express require
const express = require("express");
// create an app with express
const app = express();
// require dotenv
require("dotenv").config();
// create and app port
const port = process.env.PORT || 5000;

// home route content
app.get("/", (req, res) => {
  res.send("Hotel Booking Server is Running. ");
});

// my express app listening on port
app.listen(port, () => {
  console.log(`Hotel Booking Server running on port ${port}`);
});
