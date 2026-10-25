const express = require("express");

const {
    getDashboardData
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get("/", getDashboardData);

module.exports = router;
