var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const user = req.user || { Name: 'Unknown User' };
  res.render('index', { user, title: 'Express' });
});

module.exports = router;
