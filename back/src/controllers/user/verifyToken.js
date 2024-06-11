const verifyToken = (req, res, next) => {
    res.json({ valid: true });
};

module.exports = { verifyToken };