const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const MONGODB = "mongodb://root:root@localhost/mongoHeadlines?authSource=admin"
const PORT = process.env.PORT || 8080;

// Initialize Express
const app = express();

// Make public a static folder
app.use(express.static("./public"));

// Configure middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to the Mongo DB for Heroku deployment
mongoose.Promise = Promise;
mongoose.connect(MONGODB, { useNewUrlParser: true })
mongoose.set("useCreateIndex", true)

// old connectino to mongo
// mongoose.connect("mongodb://root:root@localhost/mongoHeadlines?authSource=admin", { useNewUrlParser: true });

// handlebars setup
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
// Import routes and give the server access to them.
const routes = require("./routes/api");

app.use(routes);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
