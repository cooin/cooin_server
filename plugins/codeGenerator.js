/**
 * codeGenerator
 */

const util_codeGenerator = require('../lib/codeGenerator');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const ActivityCode = DB.getModel('activityCode');

  let array_code;

  const awardConfig = {
    100: 1,
    50: 5,
    10: 10,
    5: 984
  };

  const internal = {};

  //获取奖励
  internal.getAward = () => {
    const array_award = [];
    for (let key in awardConfig) {
      for (let i = 0; i < awardConfig[key]; i++) {
        array_award.push(key);
      }
    }
    return array_award;
  }


  //生成code
  util_codeGenerator.generate().then(() => {

    //查询是否已经生成了奖励
    return ActivityCode.count();
  }).then(count => {
    if (count) return;

    //获取code
    return util_codeGenerator.gets(1000).then(data => {
      array_code = data;

      //获取奖品
      const array_award = internal.getAward();

      const docs = [];

      array_code.forEach((item, index) => {
        docs.push({
          code: item,
          awardAmount: array_award[index]
        });
      });
      return ActivityCode.bulkCreate(docs);
    });
  })

  next();
};

exports.register.attributes = {
  name: 'codeGenerator',
  version: '1.0.0'
};
