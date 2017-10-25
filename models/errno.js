function Errno() {

};

//0: 客户端可以静默处理的的错误无需显示给客户, 1: 按照server的errmsg回显给用户, 2 需要客户端后续处理
Errno.Reaction = {};


Errno.Success = 0;
//system error: from 100 - 199
Errno.System = {};
Errno.System.unknown = 500;
Errno.System.badImplementation = 500;
Errno.System.notImplemented = 501;
Errno.System.badGateway = 502;
Errno.System.serverUnavailable = 103;
Errno.System.gatewayTimeout = 504;

// CRUD
Errno.CRUD = {};
Errno.CRUD.duplicated = 521

Errno.Passport = {};
Errno.Passport.userNotFound = 7001;
Errno.Passport.passwordMismatch = 7002;

module.exports = Errno;
