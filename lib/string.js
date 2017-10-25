/**
 * 获取随机字符串
 * @param length
 * @returns {string}
 */
exports.random = length => {
  const data = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += data.charAt(parseInt(Math.random() * data.length, 10));
  }
  return str;
}

/**
 * 隐藏手机号码
 * @param phoneNumber
 * @returns {string}
 */
exports.hidePhoneNumber = phoneNumber => {
  return phoneNumber.toString().replace(/^(\d{3})(\d{4})/, '$1****');
}
