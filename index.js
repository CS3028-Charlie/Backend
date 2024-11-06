require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB URI with password substituted
const MONGODB_URI = "mongodb+srv://test:test@cluster0.jakdj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use("/assets", express.static("assets"));

mongoose.connect(MONGODB_URI, {  // Use MONGODB_URI directly here
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

const cors = require('cors');
app.use(cors()); // Enable CORS for all routes
