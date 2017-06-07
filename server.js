var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var request = require('request');
var geocoder = require('geocoder');
var mysql = require("mysql");
var exphbs = require("express-handlebars");

var port = 3000;

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static(__dirname + "/public"));

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// var connection = mysql.createConnection({
//     host: "geographicdelivery.com",
//     user: "geograp3_gds",
//     password: "tcarol1",
//     database: "geograp3_test"
// });

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "uncccbc",
    database: "area_mapper"
});

connection.connect(function(err) {
    if (err) {
        console.error("error connecting: " + err.stack);
        return;
    }
    console.log("connected as id " + connection.threadId);
});

// Root get route
app.get("/", function(req, res) {

    connection.query("select * from maptest2;", function(err, data) {
        if (err) throw err;

        res.render("index", { areas: data });
    });
});

// // Post route -> back to home
app.post("/", function(req, res) {
    var addr = req.body.address.trim();
    var city = req.body.city.trim();
    var state = req.body.state.trim();
    var zip = req.body.zip.trim();

    var fLon = 0;
    var fLat = 0;

    geocoder.geocode(addr + "+" + city + "+" + state + "+" + zip, function(err, data) {
        // console.log(data);
        var formAddr = "'"+data.results[0].formatted_address+"'";
        var geoType = "'"+data.results[0].geometry.location_type+"'";
        fLon = data.results[0].geometry.location.lng;
        fLat = data.results[0].geometry.location.lat;

        console.log(fLon);
        console.log(fLat);

        var inQuery  = "INSERT INTO apisearches (dateTimeSub, standAddr, lon, lat, geocode, geom) VALUES (now(), "+formAddr+", "+fLon+", "+fLat+", "+geoType+", ST_GeomFromText('POINT("+fLon+" "+fLat+")', 4294967294));";
        connection.query(inQuery, function(err, data) {
            console.log('record added');
        });

        connection.query("select District, DistrictRe as DistRep, RepEmail as Email  from meckDistricts where st_contains(geom, ST_GeomFromText('POINT(" + fLon + " " + fLat + ")', 4294967294)) ;", function(err, data) {
            res.send(data);
            // res.render("index", { areas: data });
        });
    });
});

// keep server connected
setInterval(function() {
    connection.query('SELECT 1');
}, 5000);

app.listen(port);
