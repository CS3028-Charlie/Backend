const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user info to the request object
    next(); // Proceed to the next middleware/route
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;
