exports.register = function (plugin, options, next) {

  plugin.auth.strategy('jwt', 'jwt', {
    key: process.env.JWT_SECRET, // Secret key
    verifyOptions: {
      algorithms: ['HS256']
    },
    // Implement validation function
    validateFunc: (decoded, request, callback) => {
      if (decoded.type == 'admin') {
        if (decoded.expire < Date.now()) return callback(null, false);
        return callback(null, true);
      }

      if (decoded && decoded.valid) {
        // if (decoded.exp < new Date().getTime()) return callback(null, false);
        // request.user = decoded;
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    }
  });

  // Uncomment this to apply default auth to all routes
  //plugin.auth.default('jwt');

  next();
};

exports.register.attributes = {
  name: 'auth'
};
