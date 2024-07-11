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
const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints

        // encrypt default password
        bcrypt.hash(process.env.PASSWORD, 10, function (err, hash) {
            if (err) {
                console.error(err);
            } else {
                // Store hash in your password DB.
                global.db.run(`UPDATE author SET password = ? WHERE id = 1;`, hash, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("Password updated");
                    }
                });
            }
        });
    }
});

// Handle requests to the home page
app.get("/", (req, res, next) => {
    // get author details
    global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        if (err) {
            res.render("error.ejs", { error: err.message });
        } else {
            res.render("index.ejs", { author: row });
        }
    });
});

// Add all the route handlers in usersRoutes to the app under the path /users
const readerRoutes = require("./routes/reader");
app.use("/reader", readerRoutes);

// Middleware to check if the user is logged in
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

// Handle requests to author login page
app.get("/login", (req, res, next) => {
    // get author details
    global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        if (err) {
            console.error(err);
            res.render("error.ejs", { error: err.message });
        } else {
            // render login page
            return res.render("author-login.ejs", { author: row, message: req.query.message });
        }
    });
});

app.post("/auth", (req, res, next) => {
    // get password from db
    global.db.get(`SELECT password FROM author WHERE id = '1';`, (err, row) => {
        if (err) {
            console.error(err);
            res.render("error.ejs", { error: err.message });
        } else {
            // compare password
            bcrypt.compare(req.body.password, row.password, function (err, result) {
                if (result) {
                    // set user to logged in
                    req.session.loggedin = true;
                    res.redirect("/author");
                } else {
                    res.redirect("/login?message=Wrong password");
                }
            });
        }
    });
});

app.get("/error", (req, res, next) => {
    res.render("error.ejs", { error: req.query.error });
})

// Error handling middleware
app.use((err, req, res, next) => {
    // Log the error stack for debugging
    console.error(err.stack);

    // render the error page
    res.status(500).render("error.ejs", { error: err.message })
});

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`CM2040-Database-Networks-Web-Midterm app listening on port ${port}`);
});
