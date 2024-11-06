require('dotenv').config(); // Load environment variables

const cors = require('cors');
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

// Allow CORS from specific frontend URL
app.use(cors({
  origin: 'https://charlie-card-frontend-4e147d877237.herokuapp.com',  // Allow frontend app
  methods: ['GET', 'POST'],
  credentials: true  // Include cookies if needed
}));