const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtAuthMiddleware = (req, res, next) => {
    let token = null;
    const authHeader = req.headers.authorization;
    // Check for token in Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(7);
    }
    if(!token && req.cookies && req.cookies.jwttoken) {
        token = req.cookies.jwttoken;
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided, authorization denied' });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); 
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ success: false, message: 'Token expired, please log in again' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token, authorization denied' });
    }
}

const viewerOnly = (req, res, next) => {
    if (req.user.role !== 'viewer') {
    return res.status(403).json({
      error: "viewer access only"
    });
  }
  next();
}
const analystOnly = (req, res, next) => {
    if (req.user.role !== 'analyst') {
    return res.status(403).json({
      error: "analyst access only"
    });
  }
  next();
}
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: "admin access only"
    });
  }
  next();
}

module.exports = {
    jwtAuthMiddleware,
    viewerOnly,
    analystOnly,
    adminOnly
}