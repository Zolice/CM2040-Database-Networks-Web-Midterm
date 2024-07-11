const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

router.get("/", (req, res, next) => {
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

    // render reader page
    Promise.all([getAuthorDetails, getPublishedArticles])
        .then(([getAuthorDetails, getPublishedArticles]) => {
            // render the page
            return res.render("reader.ejs", {
                author: getAuthorDetails,
                articles: getPublishedArticles,
                message: req.query.message,
            });
        })
        .catch((err) => {
            next(err)
        });
});

router.get("/article", (req, res, next) => {
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

    // render article page
    Promise.all([getAuthorDetails, getArticleDetails, getComments])
        .then(([getAuthorDetails, getArticleDetails, getComments]) => {
            console.log(getArticleDetails)
            // if article is not published
            if (getArticleDetails.state !== "published") {
                return res.redirect(`/reader?message=This article is not published`);
            }

            // render the page
            res.render("article.ejs", { author: getAuthorDetails, article: getArticleDetails, comments: getComments, message: req.query.message });

            // add view counter
            global.db.run(`UPDATE articles SET number_of_reads = number_of_reads + 1 WHERE id =?;`, [req.query.id]);
        })
        .catch((err) => {
            next(err)
        });
});

router.get("/article/comment", [
    check('comment', "Please leave a comment").not().isEmpty(),
    check('id', "Please enter a valid article id").isInt().not().isEmpty()
], (req, res, next) => {
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
            next(err)
        }
        else {
            // redirect to article page
            return res.redirect(`/reader/article?id=${req.query.id}&message=Comment added successfully`);
        }
    });
})

router.get("/article/like", [
    check('id', "Please enter a valid article id").isInt().not().isEmpty()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // return error
        return res.render('error.ejs', { error: errors.array()[0].msg });
    }

    // add like
    global.db.run(`UPDATE articles SET number_of_likes = number_of_likes + 1 WHERE id =?;`, [req.query.id], (err) => {
        if (err) {
            next(err)
        }
        // redirect to article page
        return res.redirect(`/reader/article?id=${req.query.id}&message=Like added successfully`);
    });
})

module.exports = router;