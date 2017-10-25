const client = require('./redis').getClient();

const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const key = 'userId';
const key_ = 'userId_';
const key__ = 'userId__';

/**
 * ID生成器
 */
exports.generate = () => {

  const internal = {};

  //根据前缀生成特定区间的ID
  internal.generate = prefix => {
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
              array.push(prefix + str.charAt(i1) + str.charAt(i2) + str.charAt(i3) + str.charAt(i4));
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
      if (data) return Promise.resolve('userId generate success');
      return Promise.resolve('userId generated');
    });
  }

  //获取前缀
  internal.getPrefix = () => {
    return client.srandmemberAsync(key__).then(data => {
      //生成前缀
      if (!data) return internal.generatePrefix().then(data => {
        return client.srandmemberAsync(key__);
      });
      return Promise.resolve(data);
    });
  }

  //生成前缀
  internal.generatePrefix = () => {
    const array = str.split('');

    //从前缀集合中随机获取一个成员
    return client.srandmemberAsync(key_).then(data => {
      if (!data) return internal.generatePrefixSet().then(data => {
        return client.srandmemberAsync(key_);
      });
      return Promise.resolve(data);
    }).then(data => {
      //把给成员从前缀集合中移动到前缀中
      return client.smoveAsync([key_, key__, data]);
    });

  }

  //生成前缀集合
  internal.generatePrefixSet = () => {
    return client.saddAsync(key_, str.split(''));
  }

  //处理
  internal.handle = () => {
    //查询生成的数据是否取完
    return client.srandmemberAsync(key).then(data => {
      if (data) return Promise.resolve();
      //删除前缀
      return client.spopAsync(key__).then(data => {
        return internal.getPrefix();
      }).then(data => {
        return internal.generate(data);
      });
    })
  }

  return internal.handle();

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
