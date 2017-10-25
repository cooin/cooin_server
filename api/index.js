const Home = require('./handlers/home');
const User = require('./handlers/user');
const Master_register = require('./handlers/master_register');
const Borrowlist = require('./handlers/borrowlist');
const Orderlist_bid = require('./handlers/orderlist_bid');
const weChat = require('./handlers/weChat');
const alipay = require('./handlers/alipay');
const autoInvest = require('./handlers/autoInvest');
const market = require('./handlers/market');
const IDGenerator = require('./handlers/IDGenerator');
const orderlist_bid_log = require('./handlers/orderlist_bid_log');
const promotion = require('./handlers/promotion');
const info = require('./handlers/info');
const postscriptGenerator = require('./handlers/postscriptGenerator');
const article = require('./handlers/article');
const activity = require('./handlers/activity');
const guessBorrowlist = require('./handlers/guessBorrowlist');
const topic = require('./handlers/topic');
const followInvest = require('./handlers/followInvest');
const image = require('./handlers/image');
const file = require('./handlers/file');
const ticker = require('./handlers/ticker');
const userIdGenerator = require('./handlers/userIdGenerator');
const coin = require('./handlers/coin');
const follow = require('./handlers/follow');
const leader = require('./handlers/leader');
const exchange = require('./handlers/exchange');
const profitRate = require('./handlers/profitRate');
const riskKLine = require('./handlers/riskKLine');
const notice = require('./handlers/notice');
const topicTag = require('./handlers/topicTag');
const activityCode = require('./handlers/activityCode');

exports.register = (plugin, options, next) => {

  plugin.route([
    {method: 'GET', path: '/', config: Home.hello},
    {method: 'GET', path: '/restricted', config: Home.restricted},
    {method: 'GET', path: '/{path*}', config: Home.notFound},
    {method: 'POST', path: '/user/register', config: User.register},
    {method: 'POST', path: '/user/login', config: User.login},
    {method: 'POST', path: '/user/authbyjwt', config: User.authByJwt},
    {method: 'GET', path: '/master_register/me', config: Master_register.queryForCurrentUser},
    {method: 'POST', path: '/master_register/me/profit', config: Master_register.updateProfit},
    {method: 'GET', path: '/master_register/me/asset', config: Master_register.queryAssetForCurrentUser},
    {method: 'GET', path: '/master_register/{userId}', config: Master_register.queryForUser},
    {method: 'GET', path: '/borrowlist/me', config: Borrowlist.queryForCurrentUser},
    {method: 'POST', path: '/borrowlist/settlement', config: Borrowlist.settlement},
    {method: 'GET', path: '/borrowlist/{borrowid}/getBonus', config: Borrowlist.getBonus},
    {method: 'GET', path: '/borrowlist/{borrowid}/order', config: Borrowlist.queryOrderForCurrentUser},
    {method: 'GET', path: '/borrowlist/{borrowid}/order/all', config: Borrowlist.queryAllOrderForCurrentUser},
    {method: 'POST', path: '/orderlist_bid', config: Orderlist_bid.save},
    {method: 'GET', path: '/orderlist_bid/me', config: Orderlist_bid.queryForCurrentUser},
    {method: 'GET', path: '/orderlist_bid/me/transCount', config: Orderlist_bid.queryTransCountForCurrentUser},
    {method: 'GET', path: '/orderlist_bid/user/{userId}', config: Orderlist_bid.queryForUser},
    {method: 'GET', path: '/orderlist_bid/user/{userId}/transCount', config: Orderlist_bid.queryTransCountForUser},
    {method: 'GET', path: '/orderlist_bid/followInvest/{followInvestId}', config: Orderlist_bid.queryForFollowInvest},
    {method: 'GET', path: '/orderlist_bid/{orderid}', config: Orderlist_bid.queryForCurrentUserByOrderid},
    {method: 'POST', path: '/orderlist_bid/{orderid}/unfreeze', config: Orderlist_bid.unfreeze},
    {method: 'POST', path: '/orderlist_bid/{orderid}/sell', config: Orderlist_bid.sell},
    {method: 'POST', path: '/queue', config: Home.enqueue},
    {method: 'GET', path: '/queue', config: Home.dequeue},
    {method: 'GET', path: '/weChat/notify', config: weChat.verify},
    {method: 'POST', path: '/weChat/notify', config: weChat.notify},
    {method: 'GET', path: '/weChat/authorizationRoute', config: weChat.authorizationRoute},
    {method: 'GET', path: '/weChat/baseAuthorization', config: weChat.baseAuthorization},
    {method: 'GET', path: '/weChat/getAccessToken', config: weChat.getAccessToken},
    {method: 'GET', path: '/weChat/getJSAPITicket', config: weChat.getJSAPITicket},
    {method: 'GET', path: '/weChat/getJSAPIConfig', config: weChat.getJSAPIConfig},
    {method: 'GET', path: '/weChat/getQRCode', config: weChat.getQRCode},
    {method: 'GET', path: '/weChat/test', config: weChat.test},
    {method: 'POST', path: '/weChat/templates/userLogin', config: weChat.sendTemplateMsgForUserLogin},
    {method: 'POST', path: '/weChat/templates/common', config: weChat.sendTemplateMsgForCommon},
    {method: 'POST', path: '/weChat/templates/reply', config: weChat.sendTemplateMsgForReply},
    {method: 'POST', path: '/alipay/setCookie', config: alipay.setCookie},
    {method: 'GET', path: '/alipay/getCookie', config: alipay.getCookie},
    {method: 'POST', path: '/autoInvest', config: autoInvest.save},
    {method: 'GET', path: '/autoInvest/me', config: autoInvest.queryForCurrentUser},
    {method: 'GET', path: '/autoInvest/combine', config: autoInvest.queryCombineForCurrentUser},
    {method: 'GET', path: '/autoInvest/{autoInvestId}/record', config: autoInvest.queryRecordForCurrentUser},
    {method: 'POST', path: '/autoInvest/{autoInvestId}/finish', config: autoInvest.finish},
    {method: 'GET', path: '/market', config: market.queryAll},
    {method: 'GET', path: '/market/kline', config: market.queryKline},
    {method: 'GET', path: '/market/ticker/all', config: market.queryTickerForAll},
    {method: 'GET', path: '/IDGenerator/get', config: IDGenerator.get},
    {method: 'GET', path: '/orderlist_bid_log/last', config: orderlist_bid_log.queryLast},
    {method: 'GET', path: '/promotion/{code}', config: promotion.queryByCode},
    {method: 'GET', path: '/info/ticker', config: info.queryTicker},
    {method: 'GET', path: '/info/trades', config: info.queryTrades},
    {method: 'GET', path: '/info/depth', config: info.queryDepth},
    {method: 'GET', path: '/info/last', config: info.queryLast},
    {method: 'GET', path: '/postscriptGenerator/get', config: postscriptGenerator.get},
    //文章
    {method: 'GET', path: '/article', config: article.query},
    {method: 'GET', path: '/article/{id}', config: article.queryById},
    //竞赛钱包
    {method: 'GET', path: '/info/borrowlist/top', config: Borrowlist.queryTop},
    {method: 'GET', path: '/info/borrowlist/topFinished', config: Borrowlist.queryTopByPeriod},
    {method: 'GET', path: '/info/borrowlist/last', config: Borrowlist.queryLast},
    {method: 'GET', path: '/info/borrowlist/lastTrade', config: Borrowlist.queryLastTrade},
    {method: 'GET', path: '/info/borrowlist/{borrowid}', config: Borrowlist.queryByBorrowid},
    {method: 'GET', path: '/info/borrowlist/{borrowid}/order/all', config: Borrowlist.queryAllOrderByBorrowid},
    {method: 'GET', path: '/info/borrowlist/ranking', config: Borrowlist.queryRanking},
    //活动
    {method: 'GET', path: '/activity', config: activity.query},
    //竞猜--竞赛钱包
    {method: 'POST', path: '/guessBorrowlist', config: guessBorrowlist.save},
    {method: 'GET', path: '/guessBorrowlist', config: guessBorrowlist.queryByPeriod},
    {method: 'GET', path: '/guessBorrowlist/me', config: guessBorrowlist.queryByPeriodForCurrentUser},
    {method: 'GET', path: '/guessBorrowlist/leftGuessCount', config: guessBorrowlist.queryLeftGuessCount},
    {method: 'GET', path: '/guessBorrowlist/winners', config: guessBorrowlist.queryWinnersByPeriod},
    //话题
    {method: 'POST', path: '/topic', config: topic.save},
    {method: 'GET', path: '/topic', config: topic.query},
    {method: 'GET', path: '/topic/me', config: topic.queryForCurrentUser},
    {method: 'GET', path: '/topic/me/follower/topic', config: topic.queryFollowerTopicForCurrentUser},
    {method: 'GET', path: '/topic/recommend', config: topic.queryRecommend},
    {method: 'GET', path: '/topic/user/{userId}', config: topic.queryForUser},
    {method: 'GET', path: '/topic/{id}', config: topic.queryById},
    {method: 'POST', path: '/topic/{id}/comment', config: topic.comment},
    {method: 'POST', path: '/topic/{id}/praise', config: topic.praise},
    {method: 'GET', path: '/topic/tag/{tag}', config: topic.queryByTag},
    {method: 'POST', path: '/topic/{id}/report', config: topic.report},
    //跟投
    {method: 'POST', path: '/followInvest', config: followInvest.save},
    {method: 'GET', path: '/followInvest/{followInvestId}', config: followInvest.queryByFollowInvestId},
    {method: 'POST', path: '/followInvest/{followInvestId}/recharge', config: followInvest.recharge},
    {method: 'POST', path: '/followInvest/{followInvestId}/finish', config: followInvest.finish},
    {method: 'GET', path: '/followInvest/me/leader', config: followInvest.queryLeaderForCurrentUser},
    {method: 'GET', path: '/followInvest/me/follower', config: followInvest.queryFollowerForCurrentUser},
    {method: 'GET', path: '/followInvest/me/follower/kline', config: followInvest.queryFollowerKLineForCurrentUser},
    {method: 'GET', path: '/followInvest/user/{userId}/follower/kline', config: followInvest.queryFollowerKLineForUser},
    {method: 'GET', path: '/followInvest/latest', config: followInvest.queryLatest},
    {method: 'GET', path: '/followInvest/talent', config: followInvest.queryTalent},
    {method: 'GET', path: '/followInvest/isFollowInvest', config: followInvest.isFollowInvest},
    //图片
    {method: 'POST', path: '/image', config: image.save},
    {method: 'POST', path: '/image/mini', config: image.saveWithMini},
    //文件
    {method: 'POST', path: '/file', config: file.save},
    //ticker
    {method: 'GET', path: '/ticker', config: ticker.query},
    {method: 'GET', path: '/ticker/recommend', config: ticker.queryForRecommend},
    //用户ID生成器
    {method: 'GET', path: '/userIdGenerator', config: userIdGenerator.get},
    //交易所
    {method: 'GET', path: '/exchange', config: exchange.query},
    {method: 'GET', path: '/exchange/{name}', config: exchange.queryByName},
    {method: 'GET', path: '/exchange/{name}/trade/kline', config: exchange.queryTradeKLine},
    //货币种类
    {method: 'GET', path: '/coin', config: coin.query},
    {method: 'GET', path: '/coin/{name}', config: coin.queryByName},
    {method: 'GET', path: '/coin/{name}/trade/kline', config: coin.queryTradeKLine},
    //关注
    {method: 'POST', path: '/follow', config: follow.save},
    {method: 'POST', path: '/follow/cancel', config: follow.cancel},
    {method: 'GET', path: '/follow/me', config: follow.queryFollowForCurrentUser},
    {method: 'GET', path: '/follow/me/fans', config: follow.queryFansForCurrentUser},
    {method: 'GET', path: '/follow/user/{userId}', config: follow.queryFollowForUser},
    {method: 'GET', path: '/follow/user/{userId}/fans', config: follow.queryFansForUser},
    {method: 'GET', path: '/follow/isFollow', config: follow.isFollow},
    //领投人
    {method: 'GET', path: '/leader/search', config: leader.search},
    {method: 'GET', path: '/leader/recommend', config: leader.queryForRecommend},
    {method: 'GET', path: '/leader/bestWeek', config: leader.queryForBestWeek},
    {method: 'GET', path: '/leader/lowRisk', config: leader.queryForLowRisk},
    {method: 'GET', path: '/leader/mediumRisk', config: leader.queryForMediumRisk},
    //赢利率
    {method: 'GET', path: '/profitRate/me', config: profitRate.queryForCurrentUser},
    {method: 'GET', path: '/profitRate/user/{userId}', config: profitRate.queryFollowForUser},
    //风险
    {method: 'GET', path: '/riskKLine/me', config: riskKLine.queryForCurrentUser},
    {method: 'GET', path: '/riskKLine/user/{userId}', config: riskKLine.queryFollowForUser},
    //notice
    {method: 'GET', path: '/notice', config: notice.query},
    {method: 'GET', path: '/notice/{id}', config: notice.queryById},
    //topicTag
    {method: 'GET', path: '/topicTag', config: topicTag.query},
    {method: 'GET', path: '/topicTag/all', config: topicTag.queryAll},
    {method: 'GET', path: '/topicTag/{tag}', config: topicTag.queryByTag},
    //activityCode
    {method: 'GET', path: '/activityCode', config: activityCode.query},
    {method: 'POST', path: '/activityCode/exchange', config: activityCode.exchange},
    {method: 'POST', path: '/activityCode/exchangeAccount', config: activityCode.exchangeAccount},
    {method: 'POST', path: '/activityCode/lottery', config: activityCode.lottery},

  ]);

  next();
};

exports.register.attributes = {
  name: 'api'
};
