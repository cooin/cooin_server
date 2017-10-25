const admin_user = require('./handlers/admin_user');
const applywithdraw = require('./handlers/applywithdraw');
const chargeAlipay = require('./handlers/chargeAlipay');
const orderlist = require('./handlers/orderlist');
const master_register = require('./handlers/master_register');
const autoInvest = require('./handlers/autoInvest');
const borrowlist = require('./handlers/borrowlist');
const promotion = require('./handlers/promotion');
const orderlist_bid = require('./handlers/orderlist_bid');
const fund_in_out = require('./handlers/fund_in_out');
const environment = require('./handlers/environment');
const bankaccount = require('./handlers/bankaccount');
const article = require('./handlers/article');
const image = require('./handlers/image');
const file = require('./handlers/file');
const activity = require('./handlers/activity');
const weChat = require('./handlers/weChat');
const notice = require('./handlers/notice');
const topicTag = require('./handlers/topicTag');
const topic = require('./handlers/topic');
const topicReport = require('./handlers/topicReport');

exports.register = (server, options, next) => {

  server.route([
    //管理员
    {method: 'POST', path: '/admin_user/login', config: admin_user.login},
    {method: 'GET', path: '/admin_user/me', config: admin_user.queryForCurrentUser},
    //提现
    {method: 'GET', path: '/applywithdraw', config: applywithdraw.query},
    {method: 'GET', path: '/applywithdraw/search', config: applywithdraw.search},
    {method: 'GET', path: '/applywithdraw/aggregation', config: applywithdraw.aggregation},
    {method: 'GET', path: '/applywithdraw/aggregation/notWithdraw', config: applywithdraw.aggregationForNotWithdraw},
    {method: 'GET', path: '/applywithdraw/export', config: applywithdraw.export},
    {method: 'GET', path: '/applywithdraw/{username}', config: applywithdraw.queryByUsername},
    {method: 'GET', path: '/applywithdraw/{username}/aggregation', config: applywithdraw.aggregationByUsername},
    {method: 'POST', path: '/applywithdraw/{applypayid}/checkNotPass', config: applywithdraw.checkNotPass},
    {method: 'POST', path: '/applywithdraw/{applypayid}/handling', config: applywithdraw.handling},
    {method: 'POST', path: '/applywithdraw/{applypayid}/failure', config: applywithdraw.failure},
    {method: 'POST', path: '/applywithdraw/{applypayid}/failureAfterSuccess', config: applywithdraw.failureAfterSuccess},
    {method: 'POST', path: '/applywithdraw/{applypayid}/success', config: applywithdraw.success},
    {method: 'POST', path: '/applywithdraw/{applypayid}/verify', config: applywithdraw.verify},
    {method: 'POST', path: '/applywithdraw/{applypayid}/verified', config: applywithdraw.verified},
    {method: 'POST', path: '/applywithdraw/successBatch', config: applywithdraw.successBatch},
    //支付宝充值
    {method: 'GET', path: '/chargeAlipay', config: chargeAlipay.query},
    {method: 'GET', path: '/chargeAlipay/search', config: chargeAlipay.search},
    {method: 'POST', path: '/chargeAlipay/{id}/success', config: chargeAlipay.success},
    //用户充值记录
    {method: 'GET', path: '/orderlist', config: orderlist.query},
    {method: 'GET', path: '/orderlist/search', config: orderlist.search},
    {method: 'GET', path: '/orderlist/aggregation', config: orderlist.aggregation},
    {method: 'GET', path: '/orderlist/{username}', config: orderlist.queryByUsername},
    {method: 'GET', path: '/orderlist/{username}/aggregation', config: orderlist.aggregationByUsername},
    {method: 'POST', path: '/orderlist/{orderid}/success', config: orderlist.success},
    //用户
    {method: 'GET', path: '/master_register', config: master_register.query},
    {method: 'GET', path: '/master_register/search', config: master_register.search},
    {method: 'GET', path: '/master_register/aggregation', config: master_register.aggregation},
    {method: 'GET', path: '/master_register/aggregation/all', config: master_register.aggregationAll},
    {method: 'GET', path: '/master_register/aggregation/ip', config: master_register.aggregationIP},
    {method: 'GET', path: '/master_register/{username}', config: master_register.queryByUsername},
    {method: 'POST', path: '/master_register/{username}', config: master_register.update},
    {method: 'GET', path: '/master_register/{username}/IPCount', config: master_register.queryIPCountByUsername},
    {method: 'POST', path: '/master_register/{username}/silent', config: master_register.silent},
    //定投
    {method: 'GET', path: '/autoInvest', config: autoInvest.query},
    {method: 'GET', path: '/autoInvest/search', config: autoInvest.search},
    {method: 'GET', path: '/autoInvest/{username}', config: autoInvest.queryByUsername},
    {method: 'GET', path: '/autoInvest/{username}/combine', config: autoInvest.queryCombineByUsername},
    //赠金钱包
    {method: 'GET', path: '/borrowlist', config: borrowlist.query},
    {method: 'GET', path: '/borrowlist/search', config: borrowlist.search},
    {method: 'GET', path: '/borrowlist/{username}', config: borrowlist.queryByUsername},
    {method: 'POST', path: '/borrowlist/{borrowid}/settlement', config: borrowlist.settlement},
    {method: 'POST', path: '/borrowlist/{borrowid}/takeBackProfit', config: borrowlist.takeBackProfit},
    //促销
    {method: 'GET', path: '/promotion', config: promotion.query},
    {method: 'GET', path: '/promotion/search', config: promotion.search},
    {method: 'GET', path: '/promotion/{id}', config: promotion.queryById},
    {method: 'POST', path: '/promotion/{id}', config: promotion.update},
    //委托
    {method: 'GET', path: '/orderlist_bid', config: orderlist_bid.query},
    {method: 'GET', path: '/orderlist_bid/search', config: orderlist_bid.search},
    {method: 'GET', path: '/orderlist_bid/{username}', config: orderlist_bid.queryByUsername},
    //流水
    {method: 'GET', path: '/fund_in_out', config: fund_in_out.query},
    {method: 'GET', path: '/fund_in_out/search', config: fund_in_out.search},
    {method: 'GET', path: '/fund_in_out/{username}', config: fund_in_out.queryByUsername},
    {method: 'GET', path: '/fund_in_out/{username}/aggregation/bonus', config: fund_in_out.aggregationByUsernameForBonus},
    //环境变量
    {method: 'GET', path: '/environment', config: environment.query},
    {method: 'POST', path: '/environment', config: environment.update},
    //银行卡
    {method: 'GET', path: '/bankaccount', config: bankaccount.query},
    {method: 'GET', path: '/bankaccount/search', config: bankaccount.search},
    {method: 'GET', path: '/bankaccount/{username}', config: bankaccount.queryByUsername},
    //文章
    {method: 'GET', path: '/article', config: article.query},
    {method: 'GET', path: '/article/{id}', config: article.queryById},
    {method: 'POST', path: '/article/{id}', config: article.update},
    {method: 'POST', path: '/article/parse', config: article.parseFromXiumi},
    //图片
    {method: 'POST', path: '/image', config: image.save},
    //文件
    {method: 'POST', path: '/file', config: file.save},
    //活动
    {method: 'POST', path: '/activity', config: activity.save},
    {method: 'GET', path: '/activity', config: activity.query},
    {method: 'GET', path: '/activity/{id}', config: activity.queryById},
    {method: 'POST', path: '/activity/{id}', config: activity.update},
    //微信
    {method: 'POST', path: '/weChat/templates/common', config: weChat.sendTemplateMsgForCommon},
    //notice
    {method: 'POST', path: '/notice', config: notice.save},
    {method: 'POST', path: '/notice/{id}', config: notice.update},
    {method: 'POST', path: '/notice/{id}/publish', config: notice.publish},
    {method: 'POST', path: '/notice/{id}/unPublish', config: notice.unPublish},
    {method: 'GET', path: '/notice', config: notice.query},
    {method: 'GET', path: '/notice/{id}', config: notice.queryById},
    //topicTag
    {method: 'POST', path: '/topicTag', config: topicTag.save},
    {method: 'POST', path: '/topicTag/{id}', config: topicTag.update},
    {method: 'POST', path: '/topicTag/{id}/publish', config: topicTag.publish},
    {method: 'POST', path: '/topicTag/{id}/unPublish', config: topicTag.unPublish},
    {method: 'GET', path: '/topicTag', config: topicTag.query},
    {method: 'GET', path: '/topicTag/all', config: topicTag.queryAll},
    {method: 'GET', path: '/topicTag/{tag}', config: topicTag.queryByTag},
    //topic
    {method: 'POST', path: '/topic/{id}/publish', config: topic.publish},
    {method: 'POST', path: '/topic/{id}/unPublish', config: topic.unPublish},
    {method: 'POST', path: '/topic/{id}/recommend', config: topic.recommend},
    {method: 'POST', path: '/topic/{id}/unRecommend', config: topic.unRecommend},
    {method: 'POST', path: '/topic/{id}', config: topic.updateArticle},
    {method: 'GET', path: '/topic/{id}/report', config: topic.queryReport},
    {method: 'GET', path: '/topic', config: topic.query},
    {method: 'GET', path: '/topic/{id}', config: topic.queryById},
    {method: 'GET', path: '/topic/comment', config: topic.queryComment},
    {method: 'POST', path: '/topic/parseFromWeChatArticle', config: topic.parseFromWeChatArticle},
    //topicReport
    {method: 'POST', path: '/topicReport/{id}/handled', config: topicReport.handled},
    {method: 'GET', path: '/topicReport', config: topicReport.query},
  ]);

  next();
};

exports.register.attributes = {
  name: 'api admin'
};
