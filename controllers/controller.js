// Node Dependencies
var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request'); 
var cheerio = require('cheerio'); 
var axios = require('axios');

// Import the Comment and Article models
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

// Index Page Render (first visit to the site)
router.get('/', function (req, res){

  // Scrape data
  res.redirect('/scrape');

});

var db = require("../models");

var app = express();


// Articles Page Render
router.get('/articles', function (req, res){

  // Query MongoDB for all article entries (sort newest to top, assuming Ids increment)
  Article.find().sort({_id: -1})

    // But also populate all of the comments associated with the articles.
    .populate('comments')

    // Then, send them to the handlebars template to be rendered
    .exec(function(err, doc){
      // log any errors
      if (err){
        console.log(err);
      } 
      // or send the doc to the browser as a json object
      else {
        var hbsObject = {articles: doc}
        res.render('index', hbsObject);
        // res.json(hbsObject)
      }
    });

});


// Web Scrape Route
router.get('/scrape', function(req, res) {

  // First, grab the body of the html with request
  axios.get("http://www.reddit.com/").then(function(response) {

    // Then, load html into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    // Store data
    var results = {};

    // Now, grab every everything with a class of "inner" with each "article" tag
    $('p.title').each(function(i, element) {

    // Save the text of the element in a "title" variable
    var title = $(element).text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).children().attr("href");
    // Save these results in an object that we'll push into the results array we defined earlier
      results.title = title
      results.link = link
      console.log("1", results)

      db.Article
        .create(results)
        .then(function(dbArticle) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Stuff");
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });

    });
});



// // A GET route for scraping the echojs website
// app.get("/scrape", function(req, res) {
//   // First, we grab the body of the html with request
//   axios.get("http://www.reddit.com/").then(function(response) {
//     // Then, we load that into cheerio and save it to $ for a shorthand selector
//     var $ = cheerio.load(response.data);
//     // Now, we grab every h2 within an article tag, and do the following:
//     $("p.title").each(function(i, element) {
//       // Save an empty result object
//       var result = {};
//       // Add the text and href of every link, and save them as properties of the result object
//       result.title = $(this)
//         .children("a")
//         .text();
//       result.link = $(this)
//         .children("a")
//         .attr("href");
//       // Create a new Article using the `result` object built from scraping
//       db.Article
//         .create(result)
//         .then(function(dbArticle) {
//           // If we were able to successfully scrape and save an Article, send a message to the client
//           res.send("Scrape Complete");
//         })
//         .catch(function(err) {
//           // If an error occurred, send it to the client
//           res.json(err);
//         });
//     });
//   });
// });

// Add a Comment Route - **API**
router.post('/add/comment/:id', function (req, res){

  // Collect article id
  var articleId = req.params.id;
  
  // Collect Author Name
  var commentAuthor = req.body.name;

  // Collect Comment Content
  var commentContent = req.body.comment;

  // "result" object has the exact same key-value pairs of the "Comment" model
  var result = {
    author: commentAuthor,
    content: commentContent
  };

  // Using the Comment model, create a new comment entry
  var entry = new Comment (result);

  // Save the entry to the database
  entry.save(function(err, doc) {
    // log any errors
    if (err) {
      console.log(err);
    } 
    // Or, relate the comment to the article
    else {
      // Push the new Comment to the list of comments in the article
      Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments':doc._id}}, {new: true})
      // execute the above query
      .exec(function(err, doc){
        // log any errors
        if (err){
          console.log(err);
        } else {
          // Send Success Header
          res.sendStatus(200);
        }
      });
    }
  });

});




// Delete a Comment Route
router.post('/remove/comment/:id', function (req, res){

  // Collect comment id
  var commentId = req.params.id;

  // Find and Delete the Comment using the Id
  Comment.findByIdAndRemove(commentId, function (err, todo) {  
    
    if (err) {
      console.log(err);
    } 
    else {
      // Send Success Header
      res.sendStatus(200);
    }

  });

});


// Export Router to Server.js
module.exports = router;