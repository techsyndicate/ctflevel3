// Import Modules
const mongoose = require("mongoose"),
    moment = require("moment");

// constant variables
const reqString = { type: String, required: true },
    reqStringFalse = { type: String, required: false };

// Schema
const userSchema = new mongoose.Schema({
    email: reqString,
    password: reqString
})

// Export Schema
module.exports = mongoose.model("User", userSchema)