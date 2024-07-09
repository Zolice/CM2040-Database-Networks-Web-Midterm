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
            if (req.query.message) {
                return res.render("reader.ejs", {
                    author: getAuthorDetails,
                    articles: getPublishedArticles,
                    message: req.query.message,
                });
            } else {
                return res.render("reader.ejs", { author: getAuthorDetails, articles: getPublishedArticles });
            }
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
});

router.get("/article", (req, res) => {
    // get article id
    if (!req.query.id) {
        return res.redirect("/reader?message=Article not found");
    }

    // get article details
    const getArticleDetails = new Promise((resolve, reject) => {
        global.db.get(`SELECT * FROM articles WHERE id =?;`, [req.query.id], (err, row) => {
            if (err) {
                reject(err);
            } else if (!row) {
                reject(new Error("Article not found"));
            } else {
                resolve(row);
            }
        });
    });

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

    // get comments
    const getComments = new Promise((resolve, reject) => {
        global.db.all(`SELECT * FROM ReaderComments WHERE article_id =?;`, [req.query.id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    Promise.all([getAuthorDetails, getArticleDetails, getComments])
        .then(([getAuthorDetails, getArticleDetails, getComments]) => {
            // if article is not published
            if (getArticleDetails.state !== "published") {
                return res.redirect(`/reader?message=This article is not published`);
            }
            
            if (req.query.message) {
                res.render("article.ejs", { author: getAuthorDetails, article: getArticleDetails, comments: getComments, message: req.query.message });
            }
            else {
                res.render("article.ejs", { author: getAuthorDetails, article: getArticleDetails, comments: getComments });
            }

            // add view counter
            global.db.run(`UPDATE articles SET number_of_reads = number_of_reads + 1 WHERE id =?;`, [req.query.id]);
        })
        .catch((err) => {
            // return res.render("error.ejs", { error: err });
            return res.status(500).json({ error: err.message });
        });
});

router.get("/article/comment", [
    check('comment', "Please leave a comment").not().isEmpty(),
    check('id', "Please enter a valid article id").isInt().not().isEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.redirect(`/reader/article?id=${req.query.id}&message=${errors.array()[0].msg}`);
    }

    // if no name, set name to anonymous
    if (!req.query.name) {
        req.query.name = "Anonymous";
    }

    // add comment
    global.db.run(`INSERT INTO ReaderComments (article_id, commenter_name, comment) VALUES (?, ?, ?);`, [req.query.id, req.query.name, req.query.comment], (err) => {
        if (err) {
            return res.render("error.ejs", { error: err.message })
        }
        return res.redirect(`/reader/article?id=${req.query.id}&message=Comment added successfully`);
    });
})

router.get("/article/like", [
    check('id', "Please enter a valid article id").isInt().not().isEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('error.ejs', { error: errors.array()[0].msg });
    }

    // add like
    global.db.run(`UPDATE articles SET number_of_likes = number_of_likes + 1 WHERE id =?;`, [req.query.id], (err) => {
        if (err) {
            return res.render("error.ejs", { error: err.message })
        }
        return res.redirect(`/reader/article?id=${req.query.id}&message=Like added successfully`);
    });
})

module.exports = router;
