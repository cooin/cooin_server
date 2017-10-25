const sharp = require("sharp");
const fs = require('fs');
const util_encrypt = require('./encrypt');

const mimeConfig = {
  'text/plain': 'txt',
  'application/pdf': 'pdf',
  'application/zip': 'zip'
};


/**
 * 保存图片
 * @param dataURL
 */
exports.save = dataURL => {
  //转换成buffer
  const buffer = Buffer.from(dataURL.split(",")[1], 'base64');
  //文件格式
  const format = mimeConfig[dataURL.match(/^data:(.*);/)[1]];
  //写入文件
  return this.write(buffer, format)
}

/**
 * 写入文件
 * @param buffer
 * @param type
 */
exports.write = (buffer, type) => {
  const fileName = `${process.env.DIR_STATIC_FILE}${util_encrypt.AHMD5(Date.now() + '')}.${type}`;
  return new Promise((resolve, reject) => {
    //以二进制格式保存
    fs.writeFile(fileName, buffer, function (err) {
      if (err) return reject(err);
      resolve(`${process.env.PROTOCOL}://${process.env.DOMAIN}/${fileName}`);
    });
  });
}


// const dataURL = 'data:text/plain;base64,dXBsb2FkIGZpbGU='
// this.save(dataURL).then(data => console.log(data)).catch(err => console.log(err));
