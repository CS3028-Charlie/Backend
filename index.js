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

// CORS configuration
const corsOptions = {
    origin: true, // Allow any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: true,
    optionsSuccessStatus: 200
};

// Apply CORS before any other middleware
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Global middleware to handle CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
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

// Configure multer storage for file uploads
// Dynamically creates directories based on card title
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = `assets/templates/${req.body.title}`
    // Create directory if it doesn't exist to prevent upload errors
    if (!originalFs.existsSync(path)) {
      originalFs.mkdirSync(path, { recursive: true });
    }
    cb(null, path)
  },
  filename: (req, file, cb) => {
    // Preserve original filename when storing
    cb(null, file.originalname)
  }
})

// Initialize multer with file size limit of 20MB
const upload = multer({
  limits: { fileSize: 20000000}, // 20MB
  storage: storage
})

// Fetch all available card templates from the templates directory
app.get('/get_card_previews', async (req, res) => {
  try {
    const cardFolders = await fs.readdir("assets/templates");
    res.json({ cards: cardFolders });
  } catch (error) {
    console.error('Error reading card previews:', error);
    res.status(500).json({ error: 'Failed to read card previews' });
  }
});

// Count the number of card templates that start with 'card-'
app.get('/assets/templates/count', async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, 'assets/templates');
    const files = await fs.readdir(templatesDir);
    // Filter for directories that start with 'card-'
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

// Delete a card template and all its associated files
app.post("/delete_card", async (req, res) => {
  const dir = req.body.card;
  const path = `assets/templates/${dir}`;

  try {
    // Check if card exists before attempting deletion
    const cards = await fs.readdir("assets/templates");
    if (!cards.includes(req.body.card)) {
      return res.status(200).send("Card already deleted");
    }

    const files = await fs.readdir(path);
    // Delete all files within the template directory
    await Promise.all(files.map(file => 
      fs.unlink(`${path}/${file}`)
    ));
    // Remove the empty directory
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

const draftsRoutes = require('./routes/drafts.js');
app.use('/api/drafts', draftsRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});


