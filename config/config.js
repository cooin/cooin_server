/**
 * 配置文件
 */

//微信配置
exports.weChat = {
  //比特矿公众号
  bitekuang: {
    name: 'bitekuang',
    account: '*****************************',
    GRANT_TYPE: 'client_credential',
    APPID: '*****************************',
    SECRET: '*****************************',
    serverConfig: {
      url: '*****************************',
      token: '*****************************',
      encodingAESKey: '*****************************'
    },
    subscribe: `**********`,
    unsubscribe: `等你哟！`,
    templates: {
      登录提醒: {
        template_id: 'GVna3KcuXMifnWYjodKn-nTWtcoNsuJn_BbxOTCh79U',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      充值到账通知: {
        template_id: 'CUw58zEdSe03UrNHLwvXEoAlPcLeMPgTn1FPF5o6Gc0',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      汇款状态通知: {
        template_id: 'KFTFocmrLo14SHOhjh9CvlD4NcP-OHuKgI63LeZzDgg',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      定投扣款提醒: {
        template_id: 'CP6ZC1S6K4YTsREJEMZPy6-133Kn-oqIIKzMVzn-Kuo',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      账户操作信息提醒: {
        template_id: 'SFiER9Pw9DeUH_xXwA-WfSIpU-fDze_u0bT8pnlfsS8',
        url: (url) => {
          return url ? url : `http://${process.env.DOMAIN}`;
        }
      },
      产品到期提醒: {
        template_id: 'NH57KK7JrrhYpZD88IySvj97THWhNvnM3jWR40c2iA0',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      问题回复通知: {
        template_id: 'DzVMVg_xGfunrhJW0fdxZ31kyRX66AhBbKk21BUeQ2Q',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      },
      委托成交提醒: {
        template_id: 'h7hfaJEatCC8d_jC0RzY4x6znibejEaldVQhkUv5Ey0',
        url: () => {
          return `http://${process.env.DOMAIN}`;
        }
      }
    }
  }
};

//银行配置
exports.bank = {
  area: '上海市',
  areaCode: '0021',
  bankNumber: 6214851211111111,
  bankName: '招商银行',
  accountName: '***',
  shortName: {
    icbc: '中国工商银行',
    pbc: '中国银行',
    cmb: '招商银行',
    ccb: '中国建设银行',
    abc: '中国农业银行',
    cib: '兴业银行',
    gdb: '广东发展银行',
    bcm: '交通银行',
    citic: '中信银行',
    ceb: '光大银行',
    pingan: '平安银行',
    oth: '其他银行'
  }
};

//查询属性
exports.attributes = {
  orderlist_bid: {
    list: ['username', 'orderid', 'bors', 'orderdate', 'orderdatedetail', 'tradePlatform', 'sellRMBBalance', 'profitRate', 'curr_type', 'moneyfrom', 'borrowid', 'bidprice', 'quantity', 'nowquantity', 'total', 'nowdealtotal', 'status', 'isMarket', 'expiredAt', 'createdAt'],
    detail: ['username', 'orderid', 'bors', 'orderdate', 'orderdatedetail', 'tradePlatform', 'sellRMBBalance', 'profitRate', 'curr_type', 'moneyfrom', 'borrowid', 'bidprice', 'quantity', 'nowquantity', 'total', 'nowdealtotal', 'status', 'isMarket', 'expiredAt', 'createdAt']
  },
  orderlist_bid_log: {
    list: ['transType', 'coinType', 'quantity', 'transPrice', 'createdAt'],
    detail: ['transNumber', 'transType', 'coinType', 'quantity', 'transPrice', 'createdAt']
  },
  kLine: {
    list: ['time', 'open', 'close', 'high', 'low', 'vol'],
    detail: ['coinType', 'unit', 'time', 'open', 'close', 'high', 'low', 'vol']
  },
  master_register: {
    list: ['activecode', 'rmb_balance', 'rmb_balance_f', 'nickname', 'avatar', 'role', 'riskIndex', 'followCount', 'fansCount', 'followInvestCount', 'fansInvestCount', 'toplimitForLeadBalance', 'managedBalance', 'commissionRate', 'profitRateFor1Day', 'profitRateFor1Week', 'profitRateFor1Month', 'profitRateFor3Month', 'profitRateFor6Month', 'profitRateFor1Year', 'averageForHoldDay', 'riskFor1Week', 'riskFor1Month', 'riskFor1Year'],
    detail: ['activecode', 'rmb_balance', 'rmb_balance_f', 'nickname', 'intro', 'avatar', 'role', 'riskIndex', 'followCount', 'fansCount', 'followInvestCount', 'fansInvestCount', 'toplimitForLeadBalance', 'managedBalance', 'commissionRate', 'profitRateFor1Day', 'profitRateFor1Week', 'profitRateFor1Month', 'profitRateFor3Month', 'profitRateFor6Month', 'profitRateFor1Year', 'averageForHoldDay', 'riskFor1Week', 'riskFor1Month', 'riskFor1Year'],
    public: ['activecode', 'nickname', 'intro', 'avatar', 'role', 'riskIndex', 'followCount', 'fansCount', 'followInvestCount', 'fansInvestCount', 'toplimitForLeadBalance', 'commissionRate', 'profitRateFor1Day', 'profitRateFor1Week', 'profitRateFor1Month', 'profitRateFor3Month', 'profitRateFor6Month', 'profitRateFor1Year', 'averageForHoldDay', 'riskFor1Week', 'riskFor1Month', 'riskFor1Year']
  },
  topic: {
    list: ['id', 'rootId', 'parentId', 'type', 'images', 'imagesMini', 'title', 'summary', 'cover', 'content', 'status', 'reportStatus', 'tags', 'isRecommend', 'recommendAt', 'praiseCount', 'opposeCount', 'commentCount', 'createdAt'],
    detail: ['id', 'rootId', 'parentId', 'type', 'images', 'imagesMini', 'title', 'summary', 'cover', 'content', 'status', 'reportStatus', 'tags', 'isRecommend', 'recommendAt', 'praiseCount', 'opposeCount', 'commentCount', 'createdAt']
  },
  followInvest: {
    list: ['leaderId', 'followInvestId', 'tradeCount', 'rmb_balance', 'rmb_balance_f', 'initialBalance', 'rechargeBalance', 'profitLimit', 'lossLimit', 'status', 'createdAt'],
    detail: ['leaderId', 'followInvestId', 'tradeCount', 'rmb_balance', 'rmb_balance_f', 'initialBalance', 'rechargeBalance', 'profitLimit', 'lossLimit', 'status', 'createdAt']
  },
  follow: {
    list: ['followUserId', 'createdAt'],
    detail: ['followUserId', 'createdAt']
  },
  exchange: {
    list: ['name', 'name_cn', 'logo', 'cover', 'leaderCount'],
    detail: ['name', 'name_cn', 'logo', 'cover', 'leaderCount', 'intro']
  },
  coin: {
    list: ['name', 'name_cn', 'code', 'logo', 'cover', 'leaderCount'],
    detail: ['name', 'name_cn', 'code', 'logo', 'cover', 'leaderCount', 'intro']
  },
  profitRate: {
    list: ['rate', 'time'],
    detail: ['rate', 'time']
  },
  riskKLine: {
    list: ['index', 'time'],
    detail: ['index', 'time']
  },
  notice: {
    list: ['id', 'title', 'content', 'status', 'publishedAt'],
    detail: ['id', 'title', 'content', 'status', 'publishedAt']
  },
  topicTag: {
    list: ['id', 'logo', 'cover', 'tag', 'intro', 'status', 'heat', 'qqGroup', 'whitePaper'],
    publicList: ['id', 'logo', 'tag', 'heat', 'qqGroup', 'whitePaper'],
    detail: ['id', 'logo', 'cover', 'tag', 'intro', 'status', 'heat', 'qqGroup', 'whitePaper'],
  }
};

//动态环境变量（允许动态修改）
exports.dynamicEnvironment = [
  'MARKET_FLOAT_BTC_POSITIVE',
  'MARKET_FLOAT_BTC_NEGATIVE',
  'MARKET_FLOAT_LTC_POSITIVE',
  'MARKET_FLOAT_LTC_NEGATIVE',
  'MARKET_FLOAT_ETH_POSITIVE',
  'MARKET_FLOAT_ETH_NEGATIVE'
];

//货币种类及货币属性
exports.coin = {
  btc: {
    code: 1,
    name: 'btc',
    name_cn: '比特币',
    intro: '比特币（BitCoin）的概念最初由中本聪在2009年提出，根据中本聪的思路设计发布的开源软件以及建构其上的P2P网络。比特币是一种P2P形式的数字货币。点对点的传输意味着一个去中心化的支付系统。与大多数货币不同，比特币不依靠特定货币机构发行，它依据特定算法，通过大量的计算产生，比特币经济使用整个P2P网络中众多节点构成的分布式数据库来确认并记录所有的交易行为，并使用密码学的设计来确保货币流通各个环节安全性。P2P的去中心化特性与算法本身可以确保无法通过大量制造比特币来人为操控币值。基于密码学的设计可以使比特币只能被真实的拥有者转移或支付。这同样确保了货币所有权与流通交易的匿名性。比特币与其他虚拟货币最大的不同，是其总数量非常有限，具有极强的稀缺性。该货币系统曾在4年内只有不超过1050万个，之后的总数量将被永久限制在2100万个。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_btc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_btc.png`,
    field_prefix: 'btc',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 0.5,
    order_robot_super_max: 5,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  ltc: {
    code: 2,
    name: 'ltc',
    name_cn: '莱特币',
    intro: 'Litecoin莱特币受到了比特币(BTC)的启发，并且在技术上具有相同的实现原理，其创造和转让基于一种开源的加密协议，不受任何中央机构管理。作为旨在对比特币的一些问题进行改进，Ltc网络每2.5分钟就可以处理一个块，交易确认更为迅捷；同时Litecoin在其工作量证明算法中使用了scrypt加密算法。截至目前，莱特币已经成功通过隔离验证（SW），同时其闪电网络测试也获得成功，在后续，莱特币还将推出智能合约及匿名交易功能。LTC网络预期产出8400万，据目前产量为51110625?，下一次减半时间约为2019年8月19日。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_ltc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_ltc.png`,
    field_prefix: 'bt2',
    decimal: 6,
    order_robot_min: 0.1,
    order_robot_max: 50,
    order_robot_super_max: 200,
    order_user_min: 0.1,
    order_user_max: 100000
  },
  eth: {
    code: 3,
    name: 'eth',
    name_cn: '以太坊',
    intro: '以太坊 (Ethereum) 是一个基于P2P数字加密算法的去中心化可编程平台，包含数字货币和智能合约等特色功能，现存总量约8千万枚。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_eth.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_eth.png`,
    field_prefix: 'bt3',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  etc: {
    code: 4,
    name: 'etc',
    name_cn: '以太坊经典',
    intro: ' 以太经典 (Ethereum Classic)是以太坊在1,920,000个块后硬分叉出的分叉币种，功能和以太坊极为类似。ETC秉承去中心化理念，通过区块链保证的共识机制。ETC坚信，区块链一旦开始运行，它的发展方向就不被任何中心团队所左右，而是按照参与整个网络人员的共识和全网算力的共识所决定。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_etc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_etc.png`,
    field_prefix: 'bt4',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  dgd: {
    code: 5,
    name: 'dgd',
    name_cn: 'DigixDAO',
    intro: 'DigixGlobal 是由伦敦金银市场协会认证的以太坊资产平台，该平台的目标是在以太坊网络中创建一个新型的金本位数字支付系统。 DGX 俗称数字黄金，是 Digix 发布的基于以太坊的黄金代币，以 100% 黄金衡量，能用于兑换纯实的黄金。每个 DGX 代币代表 1 克由伦敦金银市场协会认证的黄金。本次发布的 DGD 是一项基于以太坊的资产，代表 DigixDAO 的股权。 DGD 持有者将有权以投票的方式参与公司的决策，并且还会收到数字黄金 DGX 交易费中的一部分作为股权回报。在 2016 年 3 月 30 日，DigixDAO 面向全球投资者的公开 IPO 中， DGD 在 14 小时内完成 550 万美元 IPO 。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_dgd.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_dgd.png`,
    field_prefix: 'bt5',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  bts: {
    code: 6,
    name: 'bts',
    name_cn: '比特股',
    intro: '比特股（BitShares, BTS)由BTSX更名为BTS，是一个基于石墨烯区块链技术的去中心化金融服务综合平台。 任何个人或机构都可以在平台上自由的进行转账、借贷、交易、发行资产如虚拟币、公司股票、众筹项目、积分、商品期货等，也可以基于平台快速搭建低成本、高性能的虚拟币/股票/贵金属交易所。 比特股平台有去中心化的：锚定货币、交易所、资产管理、加密私信、匿名功能等。比特股更有为符合企业监管需求的黑/白名单功能、高级多重签名、投票功能等。有外部信息输入系统可用于博彩、现实预测等等其它的应用。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_bts.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_bts.png`,
    field_prefix: 'bt6',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  dcs: {
    code: 7,
    name: 'dcs',
    name_cn: '社区股',
    intro: '该资产名称为社区股（英文名：Digital Community Share,发行代码：DCS）总计10,000,000份，其中2,660,807份（占总量的26.60807％）通过众筹模式出让，其余7,339,193份（占总量的73.39193％）由巴比特官方持有，不进行交易。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_dcs.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_dcs.png`,
    field_prefix: 'bt7',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  sc: {
    code: 8,
    name: 'sc',
    name_cn: '云储币',
    intro: 'Sia 最初的设计目的是：让云储存去中心化。 在这个平台上，您可以存放和提取各种各样的文件，并不需要为您的文件隐私和安全担心。通过运用加密技术，加密合约，和重复备份，Sia 能够使一群互不信任的和互不了解的计算机节点联合起来成为一种有统一运行逻辑和程序的云储存平台。这种平台将比传统的云储存平台更快，更便宜，和更可靠。因为这些互不信任的计算机节点分布于世界各地，Sia 可以在无需添加成本的情况下成为一个有效的文件及其内容的分销网络。文件上传者可以自由选择他们所使用的节点，这意味着他们可以避开一定区域内的节点，或只用那些他们认为可信的节点。去中心化是指把上传的一个文件分成许多小块并把每个小块存放在不同的计算机节点上。在这些存放文件的节点中，只需一小部分节点是可信任的，就可以使上传文件既安全又可靠。Sia 使用 Reed Solomon 编码技术（erasure coding）,这意味着即使大量的主机离线也不会损坏文件。为避免从中心化的存储供应商那里租赁存储空间带来的诸多问题，Sia 提供 P2P 的空间租赁平台。Sia 只存储用户建立的合约。空间提供商若能提供合约证明则获得奖励，若丢失证明则受到惩罚。由于这些合约都被区块链所公开发表，因此存储合约的公信度被有效加强。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_sc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_sc.png`,
    field_prefix: 'bt8',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  '1st': {
    code: 9,
    name: '1st',
    name_cn: 'Firstblood',
    intro: '第一滴血代币 (“1S?”)是第一滴血电竞联盟和平台经济里面不可分割的一部分.持用 1S? 应用代币的四大用处主要有：(1) 参与比赛(2) 作为评审和见证人处理赛事可以获得平台所收取的手续费(3) 获取邀请朋友所加入平台的手续费(4) 建立自己的电竞团队参与国际竞赛，获取奖金。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_1st.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_1st.png`,
    field_prefix: 'bt9',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  rep: {
    code: 10,
    name: 'rep',
    name_cn: 'Augur',
    intro: 'Augur 是建立在以太坊平台上的去中心化预测市场平台。利用 Augur ,任何人都可以为任何自己感兴趣的主题（比如美国大选谁会获胜）创建一个预测市场，并提供初始流动性，这是一个去中心化的过程。作为回报，该市场的创建者将从市场中获得一半的交易费用。普通用户可以根据自己的信息和判断在 Augur 上预测、买卖事件的股票，例如美国总统大选。当事件发生以后，如果你预测正确、持有正确结果的股票，每股你将获得1美元，从而你的收益是1美元减去当初的买入成本。如果你预测错误、持有错误结果的股票，你将不会获得奖励，从而你的亏损就是当初的买入成本。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_rep.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_rep.png`,
    field_prefix: 'bt10',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  ans: {
    code: 11,
    name: 'ans',
    name_cn: '小蚁股',
    intro: '小蚁区块链协议的内置核心代币（Token）——小蚁股（ANS - Antshares）。小蚁股代表小蚁区块链的所有权，用于选举记账，获得小蚁币分红等。小蚁股代表了小蚁区块链的权益，是小蚁区块链的核心代币。小蚁区块链的市值（市场对于小蚁的价值判断）将由小蚁股的市值体现出来。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_ans.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_ans.png`,
    field_prefix: 'bt11',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  zec: {
    code: 12,
    name: 'zec',
    name_cn: 'ZCash',
    intro: 'Zcash 是建立在区块链上的隐私保密技术。和比特币不同， Zcash 交易自动隐藏区块链上所有交易的发送者、接受者和数额。只用那些拥有查看秘钥的人才能看到交易的内容。用户拥有完全的控制权，用户可以自己选择性地向其他人提供查看秘钥。Zcash 钱包资金分 2 种：透明资金、私有资金，透明资金类似比特币资金；私有资金加强了隐私性，涉及到私有资金的交易是保密不可查的，透明资金与透明资金的交易是公开可查的。Zcash 总量 2100 万枚，每 4 年减半一次',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_zec.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_zec.png`,
    field_prefix: 'bt12',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  zmc: {
    code: 13,
    name: 'zmc',
    name_cn: 'GMC',
    intro: 'ZMC是Zcash Mining Certificate的缩写，即代表Zcash算力权益凭证。是将Zcash的算力进行整合并平均分割后的产品。拥有ZMC的份额即代表拥有Zcash挖矿的一部分算力，从而将享有挖出Zcash后的奖励。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_zmc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_zmc.png`,
    field_prefix: 'bt13',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  gnt: {
    code: 14,
    name: 'gnt',
    name_cn: 'Golem',
    intro: 'Golem 是建立在以太坊平台上的去中心化计算机算力租赁平台。通过 Golem 平台，任何用户都可以成为算力的发售方和租用者。无论用户提供的是一台闲置的家用电脑还是几台大型的数据中心，都可以加入到 Golem 平台中。基于以太坊的交易系统被应用于 Golem 平台，用于结算算力提供者的收益和算力使用者所需要支付的费用。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_gnt.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_gnt.png`,
    field_prefix: 'bt14',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  etp: {
    code: 15,
    name: 'etp',
    name_cn: '熵\t',
    intro: 'ETP（熵）是元界区块链上的数字资产。元界是基于区块链技术开发的去中心化项目，目标是在元界上建立一个智能资产网络系统（Digital Asset Web），区块链上集成了数字身份认证（Digital Identity Verification）和价值 中介（Oracle）的服务框架。使其成为一个开放的数字价值流转的生态。元界将致力于提供基于数字资产登记、数字资产交换、数字身份、价值中介的去中心化服务。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_etp.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_etp.png`,
    field_prefix: 'bt15',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  btrx: {
    code: 16,
    name: 'btrx',
    name_cn: '赎回代币',
    intro: 'BTRX为比特儿用于回购因2015年2月14日丢失BTC造成用户损失的可交易代币。比特儿将每月按1CNY/BTRX的价格赎回。持有者还将额外获得10%平台利润。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_btrx.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_btrx.png`,
    field_prefix: 'bt16',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  cnc: {
    code: 17,
    name: 'cnc',
    name_cn: '中国币',
    intro: 'Scrypt算法，第一个中国概念币。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_cnc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_cnc.png`,
    field_prefix: 'bt17',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  doge: {
    code: 18,
    name: 'doge',
    name_cn: '狗狗币',
    intro: '狗币(Dogecoin)诞生于2013年12月12日，基于Scrypt算法。狗币系统上线后，由于reddit的助力（有数据表明在reddit狗狗币社区关注度超过7.5万，远远的超过了LTC），流量呈现爆发式发展，不过两周的时间，狗币已经铺开了专门的博客、论坛。狗币有一个好的文化背景——小费文化。Dogecoin 上线仅一周的时间，便成为第二大的小费货币,总量1000亿+。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_doge.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_doge.png`,
    field_prefix: 'bt18',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  dash: {
    code: 19,
    name: 'dash',
    name_cn: '达世币',
    intro: '达世币（DASH，原名暗黑币，原符号DRK，DarkCoin）有诸多被后来者广泛采用的创新。采用独创的11轮科学算法进行哈希运算，首次提出并实现了匿名区块转账方式。采用类似于PoW+PoS的混合挖矿方式，Masternodes获得10%的挖矿奖励。首次引入暗重力波（DGW）难度调整算法保护区块网络。总量约2200万枚。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_dash.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_dash.png`,
    field_prefix: 'bt19',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  ftc: {
    code: 20,
    name: 'ftc',
    name_cn: '羽毛币',
    intro: 'Scrypt算法，确认速度快，总量3.36亿。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_ftc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_ftc.png`,
    field_prefix: 'bt20',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  ifc: {
    code: 21,
    name: 'ifc',
    name_cn: '无限币',
    intro: 'Scrypt算法，30秒一次确认，总量巨大，约906亿。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_ifc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_ifc.png`,
    field_prefix: 'bt21',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  nmc: {
    code: 22,
    name: 'nmc',
    name_cn: '域名币',
    intro: 'NameCoin非常独特，具有域名功能，是少有的除货币属性以外还有实际用途的虚拟币。Namecoin挖矿方式采用与比特币联合挖矿的方式，挖比特币的同时可以产生Namecoin。同样的具有2100万总量。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_nmc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_nmc.png`,
    field_prefix: 'bt22',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  nxt: {
    code: 23,
    name: 'nxt',
    name_cn: '未来币',
    intro: 'NXT是一种全新设计和开发的二代币。它并不基于比特币代码库，而是选择了使用 java 全新开发。 NXT 是一种纯 POS 币，使用透明锻造 (transparent forging)的方式进行新区块的锻造。它已经通过IPO的方式完成了所有币的分发。IPO 由 BCnext (bitcointalk ID，目前匿名)在bitcointalk上发起，73人参与IPO，共募集21BTC。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_nxt.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_nxt.png`,
    field_prefix: 'bt23',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  ppc: {
    code: 24,
    name: 'ppc',
    name_cn: '点点币',
    intro: 'PPCoin，简称PPC，名字取自P2P货币的意思，即点对点货币，因此被翻译为点点币。PPC发布于2012年8月，PPC的研发团队和质数币XPM的研发团队为同一团队，技术实力强劲，为业界公认。PPC采用SHA256算法，在BTC的基础上进行了改良和优化。PPC最大的贡献在于它原创了POS利息体系，防止通货紧缩，后续的很多山寨币，都效仿了PPC的这个概念，PPC每10分钟产生1个区块，最初每个区块可以产出2070个PPC，不过截止小编发稿时，PPC的区块产量已经下降到了250个左右。PPC是一个非常流行的山寨币，其矿工人数大约是大地币TRC的20倍，大约是比特币的60分之1。当前(2013年10月12日)，每个PPC的价格大约为2.4元左右，PPC的价格在过去的一个月里上涨超过了100%，令人瞩目。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_ppc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_ppc.png`,
    field_prefix: 'bt24',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  shell: {
    code: 25,
    name: 'shell',
    name_cn: '小贝壳',
    intro: '小贝壳 (SHELL,Shellcoin) 基于PoS的数字虚拟货币，1% PoS 年利率，总量约3亿枚。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_shell.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_shell.png`,
    field_prefix: 'bt25',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  tips: {
    code: 26,
    name: 'tips',
    name_cn: '帽子币',
    intro: 'FedoraCoin(TIPS)采用独创的转账混淆办法来保证转账来源的匿名性。Scrypt算法，60秒一个确认，总量5000亿个 。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_tips.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_tips.png`,
    field_prefix: 'bt26',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  tix: {
    code: 27,
    name: 'tix',
    name_cn: '彩币',
    intro: '拥有PoW/PoS安全机制, Scrypt-Jane 算法，转账费极低，万分之一币，1分钟区块，支持交易留言。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_tix.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_tix.png`,
    field_prefix: 'bt27',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  xcp: {
    code: 28,
    name: 'xcp',
    name_cn: '合约币',
    intro: '合约方（CounterParty）是建立在比特币协议上的创新传输层，用于实现去中心化的货币，资产，交易，下注，分红等财务功能。基于此协议实现的合约币（XCP）是目前开发最为活跃的二代币之一，已经实现协议中的大部分功能。XCP初期通过烧毁比特币(Proof of Burn)的方式产生和分发，总量260万，有波动。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_xcp.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_xcp.png`,
    field_prefix: 'bt28',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  xmr: {
    code: 29,
    name: 'xmr',
    name_cn: '门罗币',
    intro: 'Monero (XMR) 是基于CryptoNote协议，致力于隐私保护的新一代虚拟货币。CrytoNote由Bytecoin为开源原创，采用环签名（Ring Signatures）方式使转账匿名化。一分钟区块，总量1.84千万。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_xmr.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_xmr.png`,
    field_prefix: 'bt29',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  xpm: {
    code: 30,
    name: 'xpm',
    name_cn: '质数币',
    intro: 'Primecoin简称XPM，中文名为质数币。该币发布以后，凭借其全新的创意和对数学学术界带来的贡献，引起了电子货币行业极大的关注，几日间，用户数量飙升，其货币价格一路看涨，当前的价格折合人民币已经达到2元左右，这对一个新币来说十分难得。质数币XPM和其它所有的电子货币都不同，它是全世界第一个为数学问题而提出的电子货币。往常，比特币行业的反对者们，经常以这样的一个观点辩驳：“比特币挖矿徒然耗费电力能源，却不产生任何的产品，没有给社会带来价值。”不过，质数币XPM发布后，这样的观点可以闭嘴了，因为质数币将会给数学学术界带来实实在在的科研贡献。质数，又叫做素数。如果一个数字，只能被1和它本身整除，那么这个数字就称为质数，比如3、11、37都是质数，质数在数学界中，存在着很多的疑难问题，比如著名的哥德巴赫猜想、黎曼猜想、孪生质数猜想、费马数、梅森质数等等，这些问题的解决，可以对人类的科学技术的发展，起到非常重要的促进作用。Primecoin每一分钟产生1个区块，每个区块包含若干个XPM的奖励（奖励数量取决于破解质数的难度）。目前，质数币XPM主要通过CPU去挖掘。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_xpm.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_xpm.png`,
    field_prefix: 'bt30',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  xtc: {
    code: 31,
    name: 'xtc',
    name_cn: '物联币',
    intro: 'TileCoin (XTC) 是一个前Skype开发人员发起的虚拟币开发项目，是第一个应用于物联网的密码币，规划有多重签名，去中心API，树链旁链等特性，总量1亿枚。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_xtc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_xtc.png`,
    field_prefix: 'bt31',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  xem: {
    code: 32,
    name: 'xem',
    name_cn: '新经币',
    intro: '新经币是NEM（New Economy Movement）新经济运动组织发行的货币的代号。NEM的创立目标是创建一套全新的数字货币及其生态系统。相较于BTC,NXT. NEM有着诸多有别与其他数字货币特性，NEM的核心是POI算法，一种基于评估个体贡献在群体中的经济活跃度的共识算法。NEM是首个在块链层面集成实施多重签名的数字货币组织，NEM多重签名在客户端中实现，简明易用，保障了NEM大大小小24项开发与社区基金，遵循严格的程序正义有序管理。一直以来，NEM以去中心化社区推动，NEM社区成为数字货币领域社区组织的典范之一。在NEM生态链，已形成三家正式注册的不同领域的创新型公司。其中猕讯Mijin创建了授权块链的商业模式。NEM的核心代码从0构建，各款软件开发坚持以测试驱动的开发这一严谨的软件工程实践方式进行，近期的成果是马赛克与移动钱包。发行一年多，NEM核心代码的继续开发和生态链的建设仍有条不紊进行。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_xem.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_xem.png`,
    field_prefix: 'bt32',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  },
  qtum: {
    code: 33,
    name: 'qtum',
    name_cn: '量子链',
    intro: '量子链Qtum是首个基于UTXO模型的POS智能合约平台，可以实现和比特币生态和以太坊生态的兼容性，并通过移动端的战略，促进区块链技术的产品化和提高区块链行业的易用性，旨在将真实商业社会与区块链世界连接。因此，量子链是一个区块链应用平台的集大成者。',
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}coin_qtum.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_coin_qtum.png`,
    field_prefix: 'bt33',
    decimal: 6,
    order_robot_min: 0.01,
    order_robot_max: 5,
    order_robot_super_max: 20,
    order_user_min: 0.01,
    order_user_max: 100000
  }
};


//交易所币种
exports.exchange = {
  okcoin: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_okcoin.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_okcoin.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_okcoin.png`,
    name: 'okcoin',
    name_cn: 'OKCoin币行',
    coins: ['btc', 'ltc', 'eth'],
    intro: 'OKCoin.cn是面向中国的虚拟货币交易平台，为北京乐酷达网络科技有限公司所有；OKCoin.com是面向全球的虚拟货币交易平台。OKCoin.cn与OKCoin.com分别由两家公司独立运营，两家公司拥有部分相同投资人。OKCoin.cn和OKCoin.com完全分离，两站账户不可互通。OKCoin建立于2013年，曾接受来自创业工场和硅谷风险投资人Tim Draper的一百万美元的天使投资资金。2013年底，OKCoin完成了千万美元级别的A轮融资，投资机构包括联创策源、曼图资本等风险投资基金。2014年3月5日，OKCoin的比特币交易量高达29.3万个，LTC更是高达1290万个，这是目前世界上虚拟货币单日交易量最高纪录。这证明了我们的系统完全可以胜任超高数额的交易，我们一直致力于为用户提供行业内更好的系统、产品和服务。'
  },
  huobi: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_huobi.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_huobi.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_huobi.png`,
    name: 'huobi',
    name_cn: '火币网',
    coins: ['btc', 'ltc'],
    intro: '火币网（HuoBi）由北京火币天下网络技术有限公司运营，是面向全球的数字货币交易平台之一。公司核心成员均毕业于清华大学、北京大学、复旦大学等国内名校，曾就职于腾讯、阿里巴巴、甲骨文、高盛等国内外知名企业。公司近200名成员具有长期的互联网和金融领域产品研发和运营经验，是安全可信赖的比特币交易平台。火币从高管到一线员工，均秉持“正直、严谨、创新、合作”的理念，以用户体验为核心，提供专业极致的数字货币基础服务。'
  },
  chbtc: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_chbtc.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_chbtc.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_chbtc.png`,
    name: 'chbtc',
    name_cn: '中国比特币',
    coins: ['btc', 'ltc', 'eth', 'etc', 'bts'],
    intro: 'CHBTC.COM, 由北京十星宝电子商务有限公司运营, 成立于2013年初，面向全球提供比特币、以太坊、莱特币、以太坊经典等多种数字资产交易服务，是安全可信赖的数字资产交易网。平台使用多重技术安全防护打造金融级别的专业数字资产交易网，致力于为数字资产投资爱好者创造一个安全、舒适、快捷的交易渠道，使投资者可以放心交易。公司核心成员由拥有长期的互联网和金融领域产品研发和运营经验及具有国际化视角的专业人士组成，从领导层到一线员工均秉承“用心服务每一刻”的理念，以用户需求为导向，以提升用户体验为核心，为全球用户提供最可靠、最便捷的数字资产服务。'
  },
  btcchina: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_btcchina.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_btcchina.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_btcchina.png`,
    name: 'btcchina',
    name_cn: '比特币中国',
    coins: ['btc', 'ltc'],
    intro: '比特币中国成立于2011年，是中国第一家比特币交易所，也是目前全球运营时间最长的比特币交易所。 我们正在寻找如您这般才华横溢、经验丰富并且积极进取的行业人才参与到下一代比特币中国的产品和服务项目中。作为我们出色团队中的一员，您将切实感受到区块链这项拥有颠覆未来金融体系潜力的新兴技术。 在这个日新月异，发展迅速的互联网时代，您必须准备好步入快节奏的团队环境，因为您将与这个时代最尖端的技术为伍。'
  },
  yunbi: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_yunbi.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_yunbi.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_yunbi.png`,
    name: 'yunbi',
    name_cn: '云币',
    coins: ['btc', 'eth', 'dgd', 'bts', 'sc', 'etc', '1st', 'rep', 'ans', 'zec', 'zmc', 'gnt'],//dcs
    intro: '北京云币科技有限公司，云币网，原名为 “貔貅交易所”，于 2013年7月1日 正式启动，并于 2014年4月正式上线，2014年10月8日正式更名为云币网。云币网使用自行研发的貔貅开源程序搭建，云币网在行业内率先实现了 100% 的准备金公开，所有的区块链资产的数量均为公开透明。秉承谷歌“不作恶”的原则，云币网承诺不动用用户的任何沉淀资金，同时坚守“透明”“公开”的底线，放弃了“杠杆”、“理财”以及很多“不透明山寨币”的上线请求，为区块链资产爱好者提供一个安全可靠、方便易用以及具有公信力的服务平台。'
  },
  bter: {
    logo: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}logo_bter.png`,
    cover: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}cover_exchange_bter.png`,
    banner: () => `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}banner_exchange_bter.png`,
    name: 'bter',
    name_cn: '比特儿',
    coins: ['btc', 'ltc', 'etp', 'btrx', 'bts', 'cnc', 'rep', 'doge', 'dash', 'eth', 'etc', 'ftc', 'ifc', 'nmc', 'nxt', 'ppc', 'shell', 'tips', 'tix', 'xcp', 'xmr', 'xpm', 'xtc', 'xem', 'zec'],
    intro: '比特儿(Bter.com) 比特币交易平台由济南智数信息科技有限公司运营，Alexa流量排名位居国内交易平台第一位，采用银行级的SSL安全连接；离线比特币钱包技术；人民币充值一分钟入账；虚拟币即时充值提现；Google Authenticator(双重认证)，保证用户的交易信息和资金安全，为用户提供安全，快捷，公平，公证的比特币交易平台。'
  }
};

exports.commissionRate = 0.08;
