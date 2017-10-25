/**
 * 携带小数位数的floor
 * @param number
 * @param decimal
 * @returns {number}
 */
exports.floor = (number, decimal) => {
  if (isNaN(number)) throw new Error('参数（number）必须是数组');
  if (isNaN(decimal)) throw new Error('参数（decimal）必须是数组');
  number = number.toString();
  decimal = parseInt(decimal);
  let index = number.indexOf('.');
  if (index < 0) return Number(number);
  if (number.length - (index + 1) <= decimal) return Number(number);
  return Number(number.substring(0, index + decimal + 1));
}

/**
 * 补全
 * @param number
 * @param length
 * @returns {string}
 */
exports.fill = (number, length) => {
  number = number.toString();
  if (number.length >= length) return number;
  let str_zero = '00000000000000000000000000';
  return str_zero.substring(0, length - number.length) + number;
}

/**
 * 随机数
 * @param start
 * @param end
 * @param decimal
 * @returns {number}
 */
exports.random = (start, end, decimal) => {
  start = Number(start);
  end = Number(end);
  decimal = Number(decimal);
  return Number(Number((Math.random() * (end - start) + start)).toFixed(decimal));
}

/**
 * 携带小数位数的ceil
 * @param number
 * @param decimal
 * @returns {number}
 */
exports.ceil = (number, decimal) => {
  if (isNaN(number)) throw new Error('参数（number）必须是数组');
  if (isNaN(decimal)) throw new Error('参数（decimal）必须是数组');
  return Math.ceil(number * Math.pow(10, decimal)) / Math.pow(10, decimal);
}
