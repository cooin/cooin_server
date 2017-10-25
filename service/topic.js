const moment = require('moment-timezone');
const config = require('../config/config');
const util_weChatArticle = require('../lib/weChatArticle');

/**
 * 查询--附评论
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachComment = (server, criteria, page, pageSize, order, session) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Topic = DB.getModel('topic');

  let data_topic;
  let data_comment;

  const sql_nickname = `(select master_register.nickname from master_register where master_register.username = topic.username)`;
  const sql_avatar = `(select master_register.avatar from master_register where master_register.username = topic.username)`;
  const sql_role = `(select master_register.role from master_register where master_register.username = topic.username)`;
  const sql_userId = `(select master_register.activecode from master_register where master_register.username = topic.username)`;
  const sql_isPraise = session ? `(select count(tp.id) from topicPraiseAndOppose tp where tp.topicId = topic.id and tp.praiseOrOppose = 1 and tp.username = '${session.username}')` : `(0)`;

  return Topic.findAndCountAll({
    raw: true,
    attributes: config.attributes.topic.list.concat([
      [Sequelize.literal(sql_nickname), 'nickname'],
      [Sequelize.literal(sql_avatar), 'avatar'],
      [Sequelize.literal(sql_role), 'role'],
      [Sequelize.literal(sql_userId), 'userId'],
      [Sequelize.literal(sql_isPraise), 'isPraise']
    ]),
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  }).then(data => {
    data_topic = data;
    //查询评论
    let array_parentId = [];
    data_topic.rows.forEach(item => array_parentId.push(item.id));
    return Topic.findAndCountAll({
      raw: true,
      attributes: config.attributes.topic.list.concat([
        [Sequelize.literal(sql_nickname), 'nickname'],
        [Sequelize.literal(sql_avatar), 'avatar'],
        [Sequelize.literal(sql_role), 'role'],
        [Sequelize.literal(sql_userId), 'userId'],
        [Sequelize.literal(sql_isPraise), 'isPraise']
      ]),
      where: {parentId: array_parentId, status: 1},
      order: [['id', 'DESC']]
    });
  }).then(data => {
    data_comment = data;
    data_topic.rows.forEach(topic => {
      topic.children = [];
      data_comment.rows.forEach(comment => {
        if (topic.id == comment.parentId) topic.children.push(comment);
      });
    });
    return Promise.resolve(data_topic);
  });

};

/**
 * 更新根话题的所属标签的热度
 * @param server
 * @param rootTopicId
 * @param increment
 */
exports.updateTopicTagHeat = (server, rootTopicId, increment) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Topic = DB.getModel('topic');
  const TopicTag = DB.getModel('topicTag');

  if (isNaN(increment)) throw new Error('increment必须是数字');

  //查询标签
  return Topic.findOne({
    attributes: ['tags'],
    where: {id: rootTopicId}
  }).then(data => {
    if (!data) throw new Error('话题不存在');

    if (!data.tags) return Promise.resolve();
    const tags = data.tags.split(',');

    return TopicTag.update({
      heat: Sequelize.literal(`heat + ${increment}`)
    }, {
      where: {tag: tags}
    });
  });

}

/**
 * 从微信图文解析文章
 * @param server
 * @param sourceUrl
 * @param username
 */
exports.parseFromWeChatArticle = (server, sourceUrl, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Topic = DB.getModel('topic');

  //查询用户
  return Master_register.count({where: {username}}).then(count => {
    if (count != 1) throw new Error('用户不存在');

    //查询解析的文章是否被解析过
    return Topic.count({where: {sourceUrl}});
  }).then(count => {
    if (count > 0) throw new Error('文章已经被解析过了');

    //解析文章
    return util_weChatArticle.handel(sourceUrl);
  }).then(data => {

    //发不者
    data.username = username;
    //为发布（方便修改内容）
    data.status = 0;
    //类型（文章）
    data.type = 2;
    //持久化
    return Topic.create(data);
  });
}
