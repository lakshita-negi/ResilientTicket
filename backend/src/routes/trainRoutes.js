const express = require("express");

const router = express.Router();

const {
    searchTrains,
    getTrainDetails
} = require("../controllers/trainController");

router.get("/search", searchTrains);
router.get("/:id", getTrainDetails);

module.exports = router;