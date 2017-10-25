const moment = require('moment-timezone');
const config = require('../config/config');

/**
 * 查询--附带举报的话题以及话题的上级
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachTopic = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Topic = DB.getModel('topic');
  const TopicReport = DB.getModel('topicReport');

  let data_topicReport;
  let data_topic;

  return TopicReport.findAndCountAll({
    raw: true,
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  }).then(data => {
    data_topicReport = data;
    //查询话题
    let array_id = [];
    data_topicReport.rows.forEach(item => {
      array_id.push(item.rootId);
      array_id.push(item.topicId);
    });
    return Topic.findAndCountAll({
      raw: true,
      where: {id: array_id}
    });
  }).then(data => {
    data_topic = data;
    data_topicReport.rows.forEach(topicReport => {
      data_topic.rows.forEach(topic => {
        if (topicReport.rootId == topic.id) topicReport.root = topic;
        if (topicReport.topicId == topic.id) topicReport.topic = topic;
      });
    });
    return Promise.resolve(data_topicReport);
  });

};

/**
 * 标记为已处理
 * @param server
 * @param id
 */
exports.handled = (server, id) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const TopicReport = DB.getModel('topicReport');

  return TopicReport.findOne({
    where: {id: id}
  }).then(data => {
    if (!data) throw new Error('举报不存在');

    return TopicReport.update({status: 1}, {
      where: {id: id}
    });
  }).then(() => {

    return TopicReport.findOne({
      where: {id: id}
    });
  });
};
