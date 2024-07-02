const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// Web Routes
router.get("/", (req, res) => {
	// get list of published articles
	const getPublishedArticles = new Promise((resolve, reject) => {
		global.db.all(
			`SELECT * FROM articles WHERE state = 'published' AND author_id = '1';`,
			(err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			}
		);
	});

	// then get list of drafts
	const getDrafts = new Promise((resolve, reject) => {
		global.db.all(
			`SELECT * FROM articles WHERE state = 'draft';`,
			(err, rows) => {
				if (err) {
					reject(err);
				} else {
					resolve(rows);
				}
			}
		);
	});

	// then render
	Promise.all([getPublishedArticles, getDrafts])
		.then(([getPublishedArticles, getDrafts]) => {
			res.render("author.ejs", {
				published: getPublishedArticles,
				draft: getDrafts,
				message: req.query.message
			});
		})
		.catch((err) => {
			console.log(err);
			res.render("error.ejs", { error: err.message });
		});

	//   res.render("author.ejs");
});

router.get("/draft", (req, res, next) => {
	if (req.query.id) {
		// get the article
		const query = `SELECT * FROM articles WHERE id = ?`;
		const query_parameters = [req.query.id];
		global.db.get(query, query_parameters, (err, row) => {
			console.log(err, row);
			if (err) {
				next({ message: err.message });
			} else {
				if (req.query.message) {
					return res.render("draft.ejs", {
						article: row,
						message: req.query.message,
					});
				} else return res.render("draft.ejs", { article: row });
			}
		});
	} else if (req.query.message) {
		return res.render("draft.ejs", { message: req.query.message });
	} else {
		res.render("draft.ejs");
	}
});

// Create Draft
router.post("/draft", [
	check("action", "Action is required").not().isEmpty()
], (req, res) => {
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
			if (!req.body.authorId) {
				errors.push({ msg: "Author ID is required" });
			}
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
		return res.render("draft.ejs", { errors: errors });
	}

	let query, query_parameters;

	switch (req.body.action) {
		case "create":
			query = `INSERT INTO Articles (author_id, title, content, state) VALUES (?, ?, ?, 'draft');`;
			query_parameters = [req.body.authorId, req.body.title, req.body.content];
			break;
		case "update":
			query = `UPDATE articles SET title = ?, content = ? WHERE id = ?;`;
			query_parameters = [req.body.title, req.body.content, req.body.articleId];
			break;
		case "delete":
			query = `DELETE FROM articles WHERE id = ?;`;
			query_parameters = [req.body.articleId];
			break;
		case "publish":
			query = `UPDATE articles SET state = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?;`;
			query_parameters = [req.body.articleId];
			break;
		default:
			return res.render("draft.ejs", { errors: errors.array() });
	}

	// Execute the query
	global.db.run(query, query_parameters, function (err) {
		if (err) {
			console.log(err);
			return res.render("error.ejs", { error: err.message });
		} else {
			switch (req.body.action) {
				case "create":
					return res.redirect(
						`/author/draft/?id=${this.lastID}&message=Draft created successfully`
					);
				case "update":
					return res.redirect(
						`/author/draft/?id=${req.body.articleId}&message=Draft updated successfully`
					);
				case "delete":
					return res.redirect(`/author/?message=Draft deleted successfully`);
				case "publish":
					return res.redirect(
						`/author/draft/?id=${req.body.articleId}&message=Draft published successfully`
					);
				default:
					return res.render("draft.ejs", { errors: errors.array() });
			}
		}
	});
});

router.get('/settings', (req, res) => {
	res.render("settings.ejs");
});

module.exports = router;
