const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5000', // Allow requests from frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB URI with password substituted
const MONGODB_URI = "mongodb+srv://test:test@cluster0.jakdj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI, {  // Use MONGODB_URI directly here
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "assets/templates/card-test")
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({
  limits: { fileSize: 20000000}, // 20MB
  storage: storage
})

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post("/upload_card", upload.array("images"), (req, res) => {
  console.log(req.body);
  console.log(req.files);
  
  res.json({
    message: "Success"
  })
});

app.use("/assets", express.static("assets"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
