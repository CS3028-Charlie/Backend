const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Default to 3000 locally

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Serve static files from "assets" directory
app.use("/assets", express.static("assets"));

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
