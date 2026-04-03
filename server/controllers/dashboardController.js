const getDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
        message: "Dashboard loaded",
        featuresReady: false
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Dashboard error"
    });
  }
};

module.exports = {
  getDashboard,
}