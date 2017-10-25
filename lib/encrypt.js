exports.MD5 = function(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    var crypto = require("crypto");
    return crypto.createHash("md5").update(str).digest("hex");
}

exports.SHA1 = function(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    var crypto = require("crypto");
    return crypto.createHash("sha1").update(str).digest("hex");
}

exports.AHMD5 = function(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    var str = buf.toString("binary");
    var crypto = require("crypto");
    return crypto.createHash("md5").update("***********************"+str).digest("hex");
}

exports.base64Encoded =  function(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data);
    return buf.toString("base64");
}
exports.base64Decoded =  function(data) {
    var Buffer = require("buffer").Buffer;
    var buf = new Buffer(data,"base64");
    return buf.toString();
}
