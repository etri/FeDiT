const express = require('express');
const router = express.Router();
const oauth2 = require('./oauth2');
const path = require('path');
router.use(express.static(path.join(__dirname, '../public')));

router.get('/authorize',
  (req,res,next)=>{
    
    // console.log('[AUTHZ HIT]',
    //   'originalUrl=', req.originalUrl,
    //   'isAuth=', req.isAuthenticated && req.isAuthenticated(),
    //   'user=', req.user ? 'yes' : 'no',
    //   'sessionID=', req.sessionID,
    //   'cookie=', req.headers.cookie ? 'yes' : 'no',
    //   'protocol=', req.protocol,
    //   'secure=', req.secure,
    //   'x-forwarded-proto=', req.headers['x-forwarded-proto'],
    //   'host=', req.get('host'),
    //   'redirect_uri=', req.query.redirect_uri,
    //   'client_id=', req.query.client_id
    // );

    if(!req.isAuthenticated()){
      req.session.returnUrl = req.originalUrl;
      req.session.save(()=>{
        next();
      });
    }
    else
      next();
  },oauth2.authorization);
router.post('/decision', oauth2.decision);
router.post('/token', oauth2.token);

module.exports = router;
