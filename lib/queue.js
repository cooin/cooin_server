const prefix = 'queue_';

const client = {};

exports.insert = (name, msg) => {
  if (!client[name]) client[name] = {
    insert: require('./redis').getClient(),
    get: require('./redis').getClient(),
    remove: require('./redis').getClient()
  };
  const key = prefix + name;
  return client[name].insert.lpushAsync(key, JSON.stringify(msg));
}

exports.get = (name, timeout) => {
  if (!client[name]) client[name] = {
    insert: require('./redis').getClient(),
    get: require('./redis').getClient(),
    remove: require('./redis').getClient()
  };
  const key = prefix + name;
  const key_ = key + '_';
  //查看未删除的消息
  return client[name].get.lindexAsync(key_, 0).then(data => {
    if (data) return Promise.resolve(data);
    if (!timeout) return client[name].get.rpoplpushAsync(key, key_);
    return client[name].get.brpoplpushAsync([key, key_, timeout]);
  });
}

exports.remove = (name, msg) => {
  if (!client[name]) client[name] = {
    insert: require('./redis').getClient(),
    get: require('./redis').getClient(),
    remove: require('./redis').getClient()
  };
  const key = prefix + name;
  const key_ = key + '_';
  return client[name].remove.lremAsync([key_, 0, msg]);
}
