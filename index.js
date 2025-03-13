require('dotenv').config(); // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const originalFs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// app.use(cors({
//   origin: 'https://charlie-card-frontend-4e147d877237.herokuapp.com', // Allow requests from frontend
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors());

// Add headers for image serving
app.use((req, res, next) => {
    if (req.path.match(/\.(jpg|jpeg|png|gif)$/i)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    next();
});

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
    if (!originalFs.existsSync(path)) {
      originalFs.mkdirSync(path, { recursive: true });
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

// Updated to use async/await with fs.promises
app.get('/get_card_previews', async (req, res) => {
  try {
    const cardFolders = await fs.readdir("assets/templates");
    res.json({ cards: cardFolders });
  } catch (error) {
    console.error('Error reading card previews:', error);
    res.status(500).json({ error: 'Failed to read card previews' });
  }
});

// New route to count card templates
app.get('/assets/templates/count', async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'assets/templates');
    const files = await fs.readdir(templatesDir);
    const folders = (await Promise.all(
      files.map(async file => {
        const stat = await fs.stat(path.join(templatesDir, file));
        return stat.isDirectory() && file.startsWith('card-') ? file : null;
      })
    )).filter(Boolean);
    
    res.json({ count: folders.length });
  } catch (error) {
    console.error('Error counting card templates:', error);
    res.status(500).json({ error: 'Failed to count card templates' });
  }
});

// Updated to use async/await with fs.promises
app.post("/delete_card", async (req, res) => {
  const dir = req.body.card;
  const path = `assets/templates/${dir}`;

  try {
    const cards = await fs.readdir("assets/templates");
    if (!cards.includes(req.body.card)) {
      return res.status(200).send("Card already deleted");
    }

    const files = await fs.readdir(path);
    
    // Delete all files in the directory
    await Promise.all(files.map(file => 
      fs.unlink(`${path}/${file}`)
    ));
    
    // Delete the directory
    await fs.rmdir(path);
    
    res.status(200).send("ok");
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(400).json({ error: 'Failed to delete card' });
  }
});

app.post("/upload_card", upload.array("images"), (req, res) => {
  res.json({
    message: "Success"
  })
});

app.use("/assets", express.static("assets"));

app.use("/api/classroom", require("./routes/classroom"));
app.use("/api/cardPurchase", require("./routes/cardPurchase"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
