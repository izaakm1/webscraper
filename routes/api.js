const express = require("express");
const router = express.Router();
// Require all models
const db = require("../models");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio")

//static picture for articles missing photos
const nprimg = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/National_Public_Radio_logo.svg/1200px-National_Public_Radio_logo.svg.png"

// homepage routing
router.get("/", (req, res) => {
    res.render("index")
});

// A GET route for scraping the NPR website
router.get("/scrape", function (req, res) {

    // empty the database
    db.Article.remove({})

    // First, we grab the body of the html with axios

    axios.get("https://www.npr.org/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        let $ = cheerio.load(response.data);
        let result = [];

        // Grab all the articles and stuff into the result array and send to db
        $(".story-wrap").each(function (i, element) {

            var temp = {}

            temp.title = $(this)
                .find(".story-text a:nth-child(2)")
                .text()
                .replace(/\s\s+/g, '')

            temp.article = $(this)
                .find(".story-text a:nth-child(3)")
                .text()
                .replace(/\s\s+/g, '')

            temp.link = $(this)
                .find(".story-text a:nth-child(2)")
                .attr("href");

            temp.image = $(this)
                .find(".story-wrap img:nth-child(1)")
                .attr("src");

            if (temp.image == undefined) {
                temp.image = nprimg
            }

            if(temp.title == ""){
            console.log(`no title! ${temp.title}`)
            }
            // if we dont have article or title then do not include
            if (temp.title !== "" && temp.title !== ".") {
                result.push(temp)
                // console.log(`${temp} !\n\n`)
            }

            // Create a new Article using the `result` object built from scraping
            db.Article.create(temp)
                .then(function (dbArticle) {
                    // View the added result in the console
                    // console.log(`success! ${dbArticle}`);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(`error! ${err}`);
                });
        });

        console.log(`\nSCRAPE COMPLETE: ${result.length} total articles\n`)
        console.log(`result title is: ${result[1].title}`)
    }).then(() => {
        debugger;
        // If we were able to successfully scrape and save an Article, send a message to the client
        db.Article.find({})
            .then((dbArticle) => {
                console.log("found something!")
                res.render("index", { article: dbArticle })
            })
            .catch((err) => {
                console.log(`\nERROR ${err}`)
            })
    })
});

// Route for getting all Articles from the db
router.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
router.post("/articles/:id", function (req, res) {
    console.log(req.body)
    let note = req.body.body
    console.log(note)
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
            console.log(dbArticle)
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Export routes for server.js to use.
module.exports = router;