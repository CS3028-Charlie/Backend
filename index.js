require('dotenv').config(); // Load environment variables

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

const app = express();

app.use(cors({
  origin: 'https://charlie-card-frontend-4e147d877237.herokuapp.com', // Allow requests from frontend
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use("/assets", express.static("assets"));

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});