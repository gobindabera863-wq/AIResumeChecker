require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Atlas connected!");
        process.exit(0);
    })
    .catch((error) => {
        console.log("❌ MongoDB connection failed");
        console.log(error.message);
        process.exit(1);
    });