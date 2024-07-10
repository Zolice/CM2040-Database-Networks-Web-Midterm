const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

// Web Routes
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

    // then get list of drafts
    const getDrafts = new Promise((resolve, reject) => {
        global.db.all(`SELECT * FROM articles WHERE state = 'draft';`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    // then render
    Promise.all([getAuthorDetails, getPublishedArticles, getDrafts])
        .then(([getAuthorDetails, getPublishedArticles, getDrafts]) => {
            console.log(getDrafts)
            res.render("author.ejs", {
                author: getAuthorDetails,
                published: getPublishedArticles,
                drafts: getDrafts,
                message: req.query.message,
            });
        })
        .catch((err) => {
            console.log(err);
            res.render("error.ejs", { error: err.message });
        });

    //   res.render("author.ejs");
});

router.get("/draft", (req, res, next) => {
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

    if (req.query.id) {
        // get the article
        const query = `SELECT * FROM articles WHERE id = ?`;
        const query_parameters = [req.query.id];
        global.db.get(query, query_parameters, (err, row) => {
            // console.log(err, row);
            if (err) {
                next({ message: err.message });
            } else {
                // check if author acquired
                Promise.all([getAuthorDetails]).then(([getAuthorDetails]) => {
                    if (req.query.message) {
                        return res.render("draft.ejs", {
                            author: getAuthorDetails,
                            article: row,
                            message: req.query.message,
                        });
                    } else {
                        return res.render("draft.ejs", {
                            author: getAuthorDetails,
                            article: row,
                        });
                    }
                });
            }
        });
    } else {
        Promise.all([getAuthorDetails]).then(([getAuthorDetails]) => {
            if (req.query.message) {
                return res.render("draft.ejs", { author: getAuthorDetails, message: req.query.message });
            } else {
                return res.render("draft.ejs", { author: getAuthorDetails });
            }
        });
    }
});

// Create Draft
router.post("/draft", [check("action", "Action is required").not().isEmpty()], (req, res) => {
    console.log("POST /draft, action:", req.body.action);

    // get validation results
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("draft.ejs", { errors: errors.array() });
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
        return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
            if (err) {
                res.render("error.ejs", { error: err.message });
            } else {
                return res.render("draft.ejs", { author: row, errors: errors });        
            }
        });
        return res.render("draft.ejs", { errors: errors });
    }

    let query, query_parameters;

    switch (req.body.action) {
        case "create":
            query = `INSERT INTO Articles (author_id, title, content, state) VALUES (?, ?, ?, 'draft');`;
            query_parameters = [1, req.body.title, req.body.content];
            break;
        case "update":
            query = `UPDATE articles SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`;
            query_parameters = [req.body.title, req.body.content, req.body.articleId];
            break;
        case "delete":
            // special case, run the queries etc here
            break;
        case "publish":
            query = `UPDATE articles SET state = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?;`;
            query_parameters = [req.body.articleId];
            break;
        // default:
        //     return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        //         if (err) {
        //             res.render("error.ejs", { error: err.message });
        //         } else {
        //             return res.render("draft.ejs", { author: row, errors: errors.array() });        
        //         }
        //     });
    }

    // Execute the query
    if (req.body.action != "delete") {
        global.db.run(query, query_parameters, function (err) {
            if (err) {
                console.log(err);
                return res.render("error.ejs", { error: err.message });
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
        const deleteComments = new Promise((resolve, reject) => {
            global.db.run(`DELETE FROM ReaderComments WHERE article_id = ?;`, [req.body.articleId], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })

        Promise.all([deleteComments]).then(() => {
            global.db.run(`DELETE FROM articles WHERE id = ?;`, [req.body.articleId], (err) => {
                if (err) {
                    console.log(err);
                    return res.render("error.ejs", { error: err.message });
                } else {
                    return res.redirect(`/author/?message=Draft deleted successfully`);
                }
            });
        })
        .catch((err) => {
            console.log(err);
            return res.render("error.ejs", { error: err.message });
        })
    }
});

router.get("/settings", (req, res) => {
    // get author details
    global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
        if (err) {
            console.log(err);
            return res.render("error.ejs", { error: err.message });
        } else {
            // check if message appended
            if (req.query.message) {
                return res.render("settings.ejs", { author: row, message: req.query.message });
            } else return res.render("settings.ejs", { author: row });
        }
    });

    // res.render("settings.ejs");
});

router.post(
    "/settings/update",
    [
        check("blogTitle", "Blog title is required").not().isEmpty(),
        check("authorName", "Author name is required").not().isEmpty(),
    ],
    (req, res) => {
        // get validation results
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("error", errors);
            return res.render("settings.ejs", { updateErrors: errors.array() });
        }

        // update author details
        const query = `UPDATE author SET name = ?, blog_name = ? WHERE id = 1;`;
        const query_parameters = [req.body.authorName, req.body.blogTitle];
        global.db.run(query, query_parameters, function (err) {
            if (err) {
                console.log(err);
                return res.render("error.ejs", { error: err.message });
            }
            return res.redirect(`/author?message=Settings updated successfully`);
        });
    }
);

router.post('/settings/password', [
    check('oldPassword', 'Old Password cannot be empty').notEmpty(),
    check('newPassword', 'New Password cannot be empty').notEmpty(),
    check('confirmPassword', 'Confirm Password cannot be empty').notEmpty(),
    check('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.newPassword)
], (req, res) => {
    // get validation results
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("error", errors);
        // get author details
        return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
            if (err) {
                console.log(err);
                return res.render("error.ejs", { error: err.message });
            } else {
                return res.render("settings.ejs", { passwordErrors: errors.array(), author: row });
                // return res.render("settings.ejs", { author: row });
            }
        });
    }

    // update author details
    const query = `SELECT password FROM author WHERE id = 1;`;
    global.db.get(query, (err, row) => {
        if (err) {
            console.log(err);
            return res.render("error.ejs", { error: err.message });
        }
        bcrypt.compare(req.body.oldPassword, row.password, function (err, result) {
            console.log(result)
            if (err) {
                console.log(err);
                return res.render("error.ejs", { error: err.message });
            }
            if (result) {
                // hash the password first
                bcrypt.hash(req.body.newPassword, 10, function (err, hash) {
                    if (err) {
                        console.log(err);
                        return res.render("error.ejs", { error: err.message });
                    }
                    const query = `UPDATE author SET password = ? WHERE id = 1;`;
                    const query_parameters = [hash];
                    return global.db.run(query, query_parameters, function (err) {
                        if (err) {
                            console.log(err);
                            return res.render("error.ejs", { error: err.message });
                        }
                        return res.redirect(`/author?message=Password updated successfully`);
                    });
                })
            } else {
                // get author details
                return global.db.get(`SELECT name, blog_name FROM author WHERE id = 1;`, (err, row) => {
                    if (err) {
                        console.log(err);
                        return res.render("error.ejs", { error: err.message });
                    } else {
                        return res.render("settings.ejs", { passwordErrors: [{ msg: 'Old Password is incorrect' }], author: row });
                    }
                });
            }
        });
    });
})

router.get('/delete', (req, res) => {
    //  get article id
    if (req.query.id) {
        // delete comments first
        const deleteComments = new Promise((resolve, reject) => {
            global.db.run(`DELETE FROM ReaderComments WHERE article_id = ?;`, [req.query.id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })

        Promise.all([deleteComments]).then(() => {
            global.db.run(`DELETE FROM articles WHERE id = ?;`, [req.query.id], (err) => {
                if (err) {
                    console.log(err);
                    return res.render("error.ejs", { error: err.message });
                } else {
                    return res.redirect(`/author/?message=Draft deleted successfully`);
                }
            });
        })
        .catch((err) => {
            console.log(err);
            return res.render("error.ejs", { error: err.message });
        })

        // const query = `DELETE FROM articles WHERE id = ?;`;
        // const query_parameters = [req.query.id];
        // global.db.run(query, query_parameters, function (err) {
        //     if (err) {
        //         console.log(err);
        //         return res.render('error.ejs', { error: err.message });
        //     }
        //     return res.redirect(`/author/?message=Article deleted successfully`);
        // });
    }
    else {
        return res.redirect(`/author/?message=Article not found`);
    }
})

router.get(`/publish`, (req, res) => {
    //  get article id
    if (req.query.id) {
        const query = `UPDATE articles SET state = 'published', published_at = CURRENT_TIMESTAMP WHERE id =?;`;
        const query_parameters = [req.query.id];
        global.db.run(query, query_parameters, function (err) {
            if (err) {
                console.log(err);
                return res.render('error.ejs', { error: err.message });
            }
            return res.redirect(`/author?message=Article published successfully`);
        });
    }
    else {
        return res.redirect(`/author/?message=Article not found`);
    }
})

module.exports = router;
