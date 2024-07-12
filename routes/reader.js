const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// Purpose: Render the reader page with author details and list of published articles
// Input: None
// Output: Rendered reader.ejs with author details and list of published articles
router.get("/", (req, res, next) => {
    // get author details
    // Purpose: Get author details
    // Input: Author ID
    // Output: Author name and blog name
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
    // Purpose: Get list of published articles
    // Input: Author ID
    // Output: List of published articles
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

// Purpose: Render the article page with article details and comments
// Input: Article ID
// Output: Rendered article.ejs with article details and comments
router.get("/article", (req, res, next) => {
    // get article id
    if (!req.query.id) {
        return res.redirect("/reader?message=Article not found");
    }

    // get article details
    // Purpose: Get article details
    // Input: Article ID
    // Output: Article details
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
    // Purpose: Get author details
    // Input: Author ID
    // Output: Author name and blog name
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
    // Purpose: Get comments for an article
    // Input: Article ID
    // Output: List of comments
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

// Purpose: Add a comment to an article
// Input: Article ID, Comment, Name
// Output: Redirect to article page with message
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
    // Purpose: Add a comment to an article
    // Input: Article ID, Comment, Name
    // Output: None
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

// Purpose: Add a like to an article
// Input: Article ID
// Output: Redirect to article page with message
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