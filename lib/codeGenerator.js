const client = require('./redis').getClient();

const str = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const key = 'baseCode';

/**
 * ID生成器
 */
exports.generate = () => {

  const internal = {};

  //根据前缀生成特定区间的ID
  internal.generate = () => {
    //查看key是否存在
    return client.existsAsync(key).then(data => {
      if (data == 1) return Promise.resolve();
      const task = [];
      //生成
      let array = [];
      for (let i1 = 0; i1 < str.length; i1++) {
        for (let i2 = 0; i2 < str.length; i2++) {
          for (let i3 = 0; i3 < str.length; i3++) {
            for (let i4 = 0; i4 < str.length; i4++) {
              array.push(str.charAt(i1) + str.charAt(i2) + str.charAt(i3) + str.charAt(i4));
              if (array.length == 100000) {
                task.push(client.saddAsync(key, array));
                array = [];
              }
            }
          }
        }
      }
      task.push(client.saddAsync(key, array));
      return Promise.all(task);
    }).then(data => {
      if (data) return Promise.resolve('baseCode generate success');
      return Promise.resolve('baseCode generated');
    });
  }

  return internal.generate();

}

/**
 * 获取ID
 * @returns {Promise.<*>}
 */
exports.get = () => {
  return client.spopAsync(key).then(data => {
    if (!data) return this.generate().then(data => {
      return client.spopAsync(key);
    });
    return Promise.resolve(data);
  });
}

/**
 * 获取ID
 * @returns {Promise.<*>}
 */
exports.gets = length => {
  if (isNaN(length)) throw new Error('length must be a integer');
  if (length <= 0) throw new Error('length must greater than 0');

  let members = [];
  //剩余members
  return client.scardAsync(key).then(count => {
    if (count < length) throw new Error(`baseCode only has ${count} members`);

    //随机获取
    return client.srandmemberAsync(key, length);
  }).then(data => {
    members = data;

    //删除元素
    return client.sremAsync([key].concat(data));
  }).then(() => {
    return members;
  })
}
