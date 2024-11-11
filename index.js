const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5000', // Allow requests from frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json())

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
    let path = `assets/templates/${req.body.title}`

    // create directory if it doesnt exist
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }

    cb(null, path)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({
  limits: { fileSize: 20000000}, // 20MB
  storage: storage
})

app.get('/get_card_previews', (req, res) => {
  const cardFolders = fs.readdirSync("assets/templates")

  res.json({
    cards: cardFolders
  })
});

app.post("/upload_card", upload.array("images"), (req, res) => {
  res.json({
    message: "Success"
  })
});

app.post("/delete_card", (req, res) => {
  const dir = req.body.card
  const path = `assets/templates/${dir}`

  // return if already deleted
  const cards = fs.readdirSync("assets/templates");
  if (!cards.includes(req.body.card)) { return res.status(200) }

  const files = fs.readdirSync(path);

  try {
    // delete directory contents
    for (const file of files) {
      fs.unlinkSync(`${path}/${file}`);
    }
    // delete directory
    fs.rmdirSync(path);

    res.status(200)

  } catch (err) {
    console.error(err)

    res.status(400)
  }

});

app.use("/assets", express.static("assets"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
