const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// Web Routes
router.get("/", (req, res) => {
  res.render("author.ejs");
});

router.get("/draft", (req, res) => {
  console.log("/draft called");

  console.log(req.query.message);

  if (req.query.id) {
    // get the article
    const query = `SELECT * FROM articles WHERE id = ?`;
    const query_parameters = [req.query.id];
    global.db.get(query, query_parameters, (err, row) => {
      if (err) {
        next(err);
      } else {
        console.log(row);
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
router.post("/draft", (req, res) => {
  console.log("hello");
  // console.log(req);

  let errors = [];

  // manual validation based on case
  console.log(req.body.action);
  if (!req.body.action) {
    console.log("entry");
    return res.render("draft.ejs", { message: "Action is required" });
  }
  console.log("Start validation");
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
      return res.status(404);
  }

  console.log("Valid done");
  console.log(errors);
  if (errors.length > 0) {
    console.log("returning errors")
    return res.render("draft.ejs", {errors: errors});
    //   return res.json(errors);
  }

  let query , query_parameters;

  switch(req.body.action) {
    case "create":
      query = `INSERT INTO Articles (author_id, title, content, state) VALUES (?, ?, ?, 'draft');`
      query_parameters = [req.body.authorId, req.body.title, req.body.content]
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
      query = `UPDATE articles SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?;`;
      query_parameters = [req.body.articleId];
      break;
    default:
      return res.status(404);
  }

  // Execute the query
  console.log("Query parameters");
  console.log(query);
  console.log(query_parameters);
  global.db.run(query, query_parameters, function (err) {
    if (err) {
      console.log(err);
      return res.render("error.ejs", err.message);
    } else {
      console.log(`Draft ${req.body.title} created successfully`);
      // return res.render("draft.ejs", {
      //   message: "Draft created successfully",
      // });

      switch(req.body.action) {
        case "create":
          return res.redirect(`/author/draft/?id=${this.lastID}&message=Draft created successfully`);
        case "update":
          return res.redirect(`/author/draft/?id=${req.body.articleId}&message=Draft updated successfully`);
        case "delete":
          return res.redirect(`/author/draft/?message=Draft deleted successfully`);
        case "publish":
          return res.redirect(`/author/draft/?id=${req.body.articleId}&message=Draft published successfully`);
          default: 
          return res.redirect(`/author/draft/?message=Success`);
      }

      return res.redirect(
        `/author/draft/?id=${this.lastID}&message=Draft created successfully`
      );
    }
  });
});

// router.post("/add-user", (req, res, next) => {
//     // Define the query
//     query = "INSERT INTO users (user_name) VALUES( ? );"
//     query_parameters = [req.body.user_name]

//     // Execute the query and send a confirmation message
//     global.db.run(query, query_parameters,
//         function (err) {
//             if (err) {
//                 next(err); //send the error on to the error handler
//             } else {
//                 res.send(`New data inserted @ id ${this.lastID}!`);
//                 next();
//             }
//         }
//     );
// });

module.exports = router;
