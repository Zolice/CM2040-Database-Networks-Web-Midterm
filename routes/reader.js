const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

router.get("/", (req, res) => {
    res.render("reader.ejs")
})

router.get("/article", (req, res) => {
    res.render('article.ejs')
})

module.exports = router