require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// app.use(cors({
//   origin: 'https://charlie-card-frontend-4e147d877237.herokuapp.com', // Allow requests from frontend
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors())

app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth.js');
app.use('/api/auth', authRoutes);

const paypalRoutes = require('./routes/paypal.js');
app.use('/api/payment', paypalRoutes);


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

    res.status(200).send("ok")

  } catch (err) {
    console.error(err)

    res.status(400).send("error")
  }

});

app.use("/assets", express.static("assets"));

app.use("/api/classroom", require("./routes/classroom"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
