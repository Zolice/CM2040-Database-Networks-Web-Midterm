/**
 * index.js
 * This is your main app entry point
 */

// Setup process env
require("dotenv").config();

// Set up express, bodyparser and EJS
const express = require("express");
const session = require("express-session");
const app = express();
const port = process.env.PORT ? process.env.PORT : 3000;
const bcrypt = require("bcrypt");
var bodyParser = require("body-parser");

app.use(
    session({
        secret: "CM2040-Database-Networks-Web",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, //https, then secure = true
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Handle requests to the home page
app.get("/", (req, res) => {
    // get author details
    const getAuthorDetails = new Promise((resolve, reject) => {
        global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
    // res.render("index.ejs");
    Promise.all([getAuthorDetails])
        .then(([authorDetails]) => {
            res.render("index.ejs", { author: authorDetails });
        })
        .catch((err) => {
            res.render("error.ejs", { error: err.message });
        });
});

// Handle requests to author login page
app.get("/login", (req, res) => {
    // get author details
    global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        if (err) {
            reject(err);
        } else {
            if (req.query.message) {
                return res.render("author-login.ejs", { author: row, message: req.query.message });
            }
            else return res.render("author-login.ejs", { author: row });
        }
    });

    // res.render("author-login.ejs");
});

// Add all the route handlers in usersRoutes to the app under the path /users
const readerRoutes = require("./routes/reader");
app.use("/reader", readerRoutes);

const authorRoutes = require("./routes/author");
app.use(
    "/author",
    (req, res, next) => {
        if (req.session.loggedin) {
            next();
        } else {
            //route to login page
            return res.redirect("/login");
        }
    },

    authorRoutes
);

app.post("/auth", async (req, res) => {
    const pw = req.body.password; //from the client

    const pwRequest = new Promise((resolve, reject) => {
        global.db.get(`SELECT password FROM author WHERE id = '1';`, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });

    Promise.all([pwRequest])
        .then(([pwRequest]) => {
            //hash check
            bcrypt.compare(pw, pwRequest.password, function (err, result) {
                if (result) {
                    req.session.loggedin = true;
                    res.redirect("/author");
                } else {
                    res.redirect("/login?message=Wrong password");
                }
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("error.ejs", { error: err.message });
            1;
        });
});

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`CM2040-Database-Networks-Web-Midterm app listening on port ${port}`);
});
