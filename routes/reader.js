const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

router.get("/", (req, res) => {
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

    // get list of published articles
    const getPublishedArticles = new Promise((resolve, reject) => {
        global.db.all(`SELECT * FROM articles WHERE state = 'published' AND author_id = '1';`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    Promise.all([getAuthorDetails, getPublishedArticles])
        .then(([getAuthorDetails, getPublishedArticles]) => {
            res.render("reader.ejs", { author: getAuthorDetails, articles: getPublishedArticles });
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

router.get("/article", (req, res) => {
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

    Promise.all([getAuthorDetails])
        .then(([getAuthorDetails]) => {
            res.render("article.ejs", { author: getAuthorDetails});
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });

    res.render("article.ejs");
});

module.exports = router;
