
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');
var jsdom = require("jsdom");

// Global to store the flights we've retrieved.
var flightStore = [];

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 80);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){

});

app.get('/', function(req, res){
  res.render('index', { title: 'Express', flights: flightStore });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
  /*
   Scrape once, then do so every hour
   */
  setInterval(buildScrapedDb, 3600000);
  buildScrapedDb();
});



function buildScrapedDb(){
  jsdom.env({
    html: "http://flightfox.com/contests?page=1/",
    scripts: ["http://code.jquery.com/jquery.js"],
    done: function (errors, window) {
      if (errors){
        console.log(errors);
        return;
      }

      var $ = window.$;
      var pagerLinks = $('#pager .links a');
      var pages = $(pagerLinks[pagerLinks.length-2]).text()
      pages = parseInt(pages, 10);
      flightStore = [];
      flightStore = flightStore.concat(parseFlights(window));
      for (var i=1; i<pages; i++){
        // Search every page
        jsdom.env({
          html: "http://flightfox.com/contests?page=" + i,
          scripts: ["http://code.jquery.com/jquery.js"],
          done: function (errors, window) {
            if (errors){
              console.log(errors);
              return;
            }
            var $ = window.$;
            flightStore = flightStore.concat(parseFlights(window));
          }
        });
        if (i===pages-1){
          console.log('done ' + pages + 'pages!');
        }
      }
    }
  });
};


function parseFlights(window){

  var $ = window.$,
  flightsDivs = $('div.flight'),
  flights = [];
  for (var i=0; i<flightsDivs.length; i++){
    var f = flightsDivs[i];
    var price = $(f).find('div.price a').html()
    var from = $(f).find('div.location:first div:first').text();
    var fromDate = $(f).find('div.location:first div.date').text();
    var to = $(f).find('div.location:last div:first').text()
    var toDate = $(f).find('div.location:last div.date').text()
    var link = $(f).find('div.timeleft div.info a').attr('href');

    var flight = {
      price: price,
      from : {
        place: from,
        date: fromDate
      },
      to: {
        place : to,
        date : toDate
      },
      link : 'http://www.flightfox.com' + link
    };

    flights.push(flight);
  }
  return flights;
};
