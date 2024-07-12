const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

// Web Routes
// Purpose: Author Homepage
// Input: None
// Output: Rendered author.ejs with author details, published articles and drafts
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
    // Purpose: Get published articles
    // Input: State and Author ID
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

    // then get list of drafts
    // Purpose: Get drafts
    // Input: State and Author ID
    // Output: List of drafts
    const getDrafts = new Promise((resolve, reject) => {
        global.db.all(`SELECT * FROM articles WHERE state = 'draft';`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    // when all promises are resolved
    Promise.all([getAuthorDetails, getPublishedArticles, getDrafts])
        .then(([getAuthorDetails, getPublishedArticles, getDrafts]) => {
            // render the page
            res.render("author.ejs", {
                author: getAuthorDetails,
                published: getPublishedArticles,
                drafts: getDrafts,
                message: req.query.message,
            });
        })
        .catch((err) => {
            console.error(err);
            res.render("error.ejs", { error: err.message });
        });
});

// Purpose: Author Draft Page
// Input: Article ID @optional
// Output: Rendered draft.ejs with author details and article details
router.get("/draft", (req, res, next) => {
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

    if (req.query.id) {
        // get the article
        // Purpose: Get article details
        // Input: Article ID
        // Output: Article details
        const query = `SELECT * FROM articles WHERE id = ?`;
        const query_parameters = [req.query.id];
        global.db.get(query, query_parameters, (err, row) => {
            if (err) {
                next({ message: err.message });
            } else {
                // check if author acquired
                Promise.all([getAuthorDetails]).then(([getAuthorDetails]) => {
                    return res.render("draft.ejs", {
                        author: getAuthorDetails,
                        article: row,
                        message: req.query.message,
                    });
                });
            }
        });
    } else {
        Promise.all([getAuthorDetails]).then(([getAuthorDetails]) => {
            return res.render("draft.ejs", { author: getAuthorDetails, message: req.query.message });
        });
    }
});

// Create Draft
// Purpose: All features within Draft
// Input: Article ID
// Output: Redirect to draft page
router.post("/draft",
    [
        // validate action
        // all other validations are done based on the action
        check("action", "Action is required").not().isEmpty()
    ], (req, res, next) => {
        // get validation results
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            // get author details
            // Purpose: Get author details
            // Input: Author ID
            // Output: Author name and blog name
            global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
                if (err) {
                    next(err)
                } else {
                    // render the page
                    return res.render("draft.ejs", { errors: errors.array(), author: row });
                }
            });
        }

        // manual validation based on case
        errors = [];
        switch (req.body.action) {
            case "create":
                // need authorid, title and content
                if (!req.body.title) {
                    errors.push({ msg: "Title is required" });
                }
                if (!req.body.content) {
                    errors.push({ msg: "Content is required" });
                }
                break;
            case "update":
                // need articleid, title and content
                if (!req.body.articleId) {
                    errors.push({ msg: "Article ID is required" });
                }
                if (!req.body.title) {
                    errors.push({ msg: "Title is required" });
                }
                if (!req.body.content) {
                    errors.push({ msg: "Content is required" });
                }
                break;
            case "delete":
                //  need articleid
                if (!req.body.articleId) {
                    errors.push({ msg: "Article ID is required" });
                }
                break;
            case "publish":
                // need articleid
                if (!req.body.articleId) {
                    errors.push({ msg: "Article ID is required" });
                }
                break;
            default:
                return res.render("draft.ejs", { errors: errors.array() });
        }
        if (errors.length > 0) {
            // Purpose: Get author details
            // Input: Author ID
            // Output: Author name and blog name
            return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
                if (err) {
                    next(err)
                } else {
                    return res.render("draft.ejs", { author: row, errors: errors });
                }
            });
        }

        let query, query_parameters;

        switch (req.body.action) {
            case "create":
                // Purpose: Insert a new article
                // Input: Author ID, Title, Content
                // Output: Inserted article ID
                query = `INSERT INTO Articles (author_id, title, content, state) VALUES (?, ?, ?, 'draft');`;
                query_parameters = [1, req.body.title, req.body.content];
                break;
            case "update":
                // Purpose: Update an article
                // Input: Title, Content, Article ID
                // Output: None
                query = `UPDATE articles SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`;
                query_parameters = [req.body.title, req.body.content, req.body.articleId];
                break;
            case "delete":
                // special case, run the queries etc here
                break;
            case "publish":
                // Purpose: Publish an article
                // Input: Article ID
                // Output: None
                query = `UPDATE articles SET state = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?;`;
                query_parameters = [req.body.articleId];
                break;
        }

        // Execute the query
        if (req.body.action != "delete") {
            global.db.run(query, query_parameters, function (err) {
                if (err) {
                    next(err)
                } else {
                    switch (req.body.action) {
                        case "create":
                            return res.redirect(`/author/draft/?id=${this.lastID}&message=Draft created successfully`);
                        case "update":
                            return res.redirect(`/author/draft/?id=${req.body.articleId}&message=Draft updated successfully`);
                        case "delete":
                            return res.redirect(`/author/?message=Draft deleted successfully`);
                        case "publish":
                            return res.redirect(`/author/draft/?id=${req.body.articleId}&message=Draft published successfully`);
                        default:
                            return res.render("draft.ejs", { errors: errors.array() });
                    }
                }
            });
        }
        else {
            // delete comments first
            // Purpose: Delete comments
            // Input: Article ID
            // Output: None
            const deleteComments = new Promise((resolve, reject) => {
                global.db.run(`DELETE FROM ReaderComments WHERE article_id = ?;`, [req.body.articleId], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            })

            Promise.all([deleteComments])
                .then(() => {
                    // Purpose: Delete an article
                    // Input: Article ID
                    // Output: None
                    global.db.run(`DELETE FROM articles WHERE id = ?;`, [req.body.articleId], (err) => {
                        if (err) {
                            next(err)
                        } else {
                            return res.redirect(`/author/?message=Draft deleted successfully`);
                        }
                    });
                })
                .catch((err) => {
                    next(err)
                })
        }
    });

// Purpose: Author Settings Page
// Input: None
// Output: Rendered settings.ejs with author details
router.get("/settings", (req, res, next) => {
    // get author details
    // Purpose: Get author details
    // Input: Author ID
    // Output: Author name and blog name
    global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        if (err) {
            console.error(err);
            return res.render("error.ejs", { error: err.message });
        } else {
            // render the page
            return res.render("settings.ejs", { author: row, message: req.query.message });
        }
    });

    // res.render("settings.ejs");
});

// Purpose: Update Author Settings
// Input: Author Name, Blog Title
// Output: Redirect to author page
router.post(
    "/settings/update",
    [
        check("blogTitle", "Blog title is required").not().isEmpty(),
        check("authorName", "Author name is required").not().isEmpty(),
    ],
    (req, res, next) => {
        // get validation results
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("error", errors);
            return res.render("settings.ejs", { updateErrors: errors.array() });
        }

        // update author details
        // Purpose: Update author details
        // Input: Author Name, Blog Title
        // Output: None
        const query = `UPDATE author SET name = ?, blog_name = ? WHERE id = 1;`;
        const query_parameters = [req.body.authorName, req.body.blogTitle];
        global.db.run(query, query_parameters, function (err) {
            if (err) {
                next(err)
            }
            return res.redirect(`/author?message=Settings updated successfully`);
        });
    }
);

// Purpose: Update Author Password
// Input: Old Password, New Password, Confirm Password
// Output: Redirect to author page
router.post('/settings/password', [
    check('oldPassword', 'Old Password cannot be empty').notEmpty(),
    check('newPassword', 'New Password cannot be empty').notEmpty(),
    check('confirmPassword', 'Confirm Password cannot be empty').notEmpty(),
    check('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.newPassword)
], (req, res, next) => {
    // get validation results
    let errors = validationResult(req);


    if (!errors.isEmpty()) {
        // get author details
        // Purpose: Get author details
        // Input: Author ID
        // Output: Author name and blog name
        return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
            if (err) {
                next(err)
            } else {
                // render the page
                return res.render("settings.ejs", { passwordErrors: errors.array(), author: row });
            }
        });
    }

    // update author details
    // get password from db
    // Purpose: Get author password
    // Input: Author ID
    // Output: Author password
    const query = `SELECT password FROM author WHERE id = 1;`;
    global.db.get(query, (err, row) => {
        if (err) {
            next(err)
        }
        // compare the old password
        bcrypt.compare(req.body.oldPassword, row.password, function (err, result) {
            if (err) {
                next(err)
            }
            if (result) {
                // hash the password first
                bcrypt.hash(req.body.newPassword, 10, function (err, hash) {
                    if (err) {
                        next(err)
                    }
                    // update the password
                    // Purpose: Update author password
                    // Input: Password, Author ID
                    // Output: None
                    const query = `UPDATE author SET password = ? WHERE id = 1;`;
                    const query_parameters = [hash];
                    return global.db.run(query, query_parameters, function (err) {
                        if (err) {
                            next(err)
                        }
                        // redirect to author page
                        return res.redirect(`/author?message=Password updated successfully`);
                    });
                })
            } else {
                // get author details
                // Purpose: Get author details
                // Input: Author ID
                // Output: Author name and blog name
                return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
                    if (err) {
                        next(err)
                    } else {
                        // render the page
                        return res.render("settings.ejs", { passwordErrors: [{ msg: 'Old Password is incorrect' }], author: row });
                    }
                });
            }
        });
    });
})

// Purpose: Delete Draft
// Input: Article ID
// Output: Redirect to author page
router.get('/delete', (req, res, next) => {
    //  get article id
    if (req.query.id) {
        // delete comments first
        // Purpose: Delete comments
        // Input: Article ID
        // Output: None
        const deleteComments = new Promise((resolve, reject) => {
            global.db.run(`DELETE FROM ReaderComments WHERE article_id = ?;`, [req.query.id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })

        // delete article
        Promise.all([deleteComments])
            .then(() => {
                global.db.run(`DELETE FROM articles WHERE id = ?;`, [req.query.id], (err) => {
                    if (err) {
                        next(err)
                    } else {
                        // redirect to author page
                        return res.redirect(`/author/?message=Draft deleted successfully`);
                    }
                });
            })
            .catch((err) => {
                next(err)
            })
    }
    else {
        // redirect to author page
        return res.redirect(`/author/?message=Article not found`);
    }
})

// Purpose: Publish Draft
// Input: Article ID
// Output: Redirect to author page
router.get(`/publish`, (req, res, next) => {
    //  get article id
    if (req.query.id) {
        const query = `UPDATE articles SET state = 'published', published_at = CURRENT_TIMESTAMP WHERE id =?;`;
        const query_parameters = [req.query.id];
        // update the state
        // Purpose: Publish an article
        // Input: Article ID
        // Output: None
        global.db.run(query, query_parameters, function (err) {
            if (err) {
                next(err)
            }
            // redirect to author page
            return res.redirect(`/author?message=Article published successfully`);
        });
    }
    else {
        // redirect to author page
        return res.redirect(`/author/?message=Article not found`);
    }
})

module.exports = router;