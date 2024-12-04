const jwt = require('jsonwebtoken');
const SECRET = "c3792225a28ea010270d7cc3d808f477523c982aa3f6de651418fe49fff15b0c4c11432ec983bba0dcd7b84c6251f69126036ea145ac78c14977679fdbadd518" //  process.env.JWT_SECRET

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next(); // Proceed to the next middleware/route
  } catch (err) {
    console.log(err)
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;
