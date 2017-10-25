const request = require('request');
const cheerio = require('cheerio');
const fs = require("fs");
const util_encrypt = require('./encrypt');

const internal = {};

/**
 * 根据文章url获取文章JSON地址
 * @param url
 */
internal.getShowInfo = url => {
  return new Promise((resolve, reject) => {
    request(url, (err, httpResponse, body) => {
      if (err) return reject(err);
      let data = null;
      eval('data=' + body.match(/injectedData\.showInfo\s*=(.*)/)[1]);
      resolve(data);
    });
  });
}

/**
 * 根据文章JSON地址获取文章详情
 * @param url
 */
internal.getDetail = url => {
  return new Promise((resolve, reject) => {
    request({
      url,
      // encoding: null,
      gzip: true,
      json: true,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, sdch',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Host: 'sd.xiumius.com',
        Origin: 'http://b.xiumi.us',
        Pragma: 'no-cache',
        Referer: 'http://b.xiumi.us/board/v5/2zqZH/38443210',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
      }
    }, (err, httpResponse, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  })
}


/**
 * 下载图片
 * @param url
 */
internal.handelImg = url => {
  return new Promise((resolve, reject) => {
    const fileName = `${process.env.DIR_STATIC_IMAGES}${util_encrypt.AHMD5(url)}${url.match(/(\.jpg|\.jpeg|\.png|\.gif)/)[1]}`;
    const writeStream = fs.createWriteStream(fileName);
    request(url).pipe(writeStream);
    writeStream.on('finish', () => {
      resolve(fileName);
    }).on('error', err => {
      reject(err);
    })
  });
}


/**
 * 根据文章地址处理文章
 * @param sourceUrl
 */
exports.handel = sourceUrl => {

  //文章JSON
  let detail;
  //下载图片任务组
  let task = [];
  //待处理图片
  let $images = [];
  //文档
  let $;

  return internal.getShowInfo(sourceUrl).then(data => {
    return internal.getDetail('https:' + data.show_data_url);
  }).then(data => {
    detail = data;

    if (!detail.$appendix.htmlForPreview) throw new Error('暂不支持该文章');

    $ = cheerio.load('<body>' + detail.$appendix.htmlForPreview + '</body>');

    //内容图片（需要授权的图片）
    $('img').each((index, item) => {
      const src = $(item).attr('src');
      //处理授权图片
      if (/img\.xiumi\.us.*/.test(src)) {
        task.push(internal.handelImg(/^http.*/.test(src) ? src : 'https:' + src));
        $images.push($(item));
      }
    });

    //封面
    task.push(internal.handelImg(/^http.*/.test(detail.cover) ? detail.cover : 'https:' + detail.cover));

    return Promise.all(task);
  }).then(images => {
    //内容图片
    $images.forEach(($image, index) => {
      $image.attr('src', `${process.env.PROTOCOL}://${process.env.DOMAIN}/${images[index]}`);
    });
    //封面
    detail.cover = `${process.env.PROTOCOL}://${process.env.DOMAIN}/${images.pop()}`;

    return Promise.resolve({
      sourceId: sourceUrl,
      title: detail.title,
      summary: detail.desc,
      cover: detail.cover,
      content: $('body').html(),
      publishedAt: new Date()
    });
  });
}
