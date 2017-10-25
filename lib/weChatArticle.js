const request = require('request');
const cheerio = require('cheerio');
const fs = require("fs");
const sharp = require("sharp");
const util_encrypt = require('./encrypt');

const internal = {};

/**
 * 获取网页
 * @param url
 */
internal.query = url => {
  return new Promise((resolve, reject) => {
    request(url, (err, httpResponse, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  })
}

/**
 * 下载图片
 * @param url
 */
internal.handleImg = url => {
  return new Promise((resolve, reject) => {
    const format = url.match(/(\.jpg|\.jpeg|\.png|\.gif)/) ? url.match(/(\.jpg|\.jpeg|\.png|\.gif)/)[1] : '';
    const fileName = `${process.env.DIR_STATIC_IMAGES}${util_encrypt.AHMD5(url)}${format}`;
    const writeStream = fs.createWriteStream(fileName);
    request(url).pipe(writeStream);
    writeStream.on('finish', () => {
      // resolve(fileName);

      //如果图片地址没有指定明确的格式
      if (format) return resolve(fileName);

      return internal.handleFormat(fileName).then(data => {
        resolve(data);
      }).catch(err => {
        reject(err);
      });
    }).on('error', err => {
      reject(err);
    })
  });
}

/**
 * 处理没有明确格式的图片（）
 * @param file
 */
internal.handleFormat = file => {
  return new Promise((resolve, reject) => {
    //读取文件
    fs.readFile(file, (err, buffer) => {
      if (err) return reject(err);

      //获取图片信息
      return sharp(buffer).metadata().then(metadata => {

        const fileName = file + '.' + metadata.format;
        //重命名
        fs.rename(file, fileName, err => {
          if (err) return reject(err);
          resolve(fileName);
        });

      }).catch(err => {
        reject(err);
      });
    });
  });
}

/**
 * 根据文章地址处理文章
 * @param sourceUrl
 */
exports.handel = sourceUrl => {
  let $;
  return internal.query(sourceUrl).then(data => {
    $ = cheerio.load(data);

    //批量下载
    const task = [];
    $('#js_content img').each((index, item) => {
      const src = $(item).attr('src') ? $(item).attr('src') : $(item).attr('data-src');
      task.push(internal.handleImg(src));
    });
    return Promise.all(task);
  }).then(images => {

    //替换图片地址
    $('#js_content img').each((index, item) => {
      $(item).attr('src', `${process.env.PROTOCOL}://${process.env.DOMAIN}/${images[index]}`);
    });

    const title = $('#activity-name').text();
    const content = $('#js_content').html();
    return Promise.resolve({title, content, sourceUrl});
  });
}



// const url = 'https://mp.weixin.qq.com/s?__biz=MjM5MTA1MjAxMQ==&mid=2651226713&idx=1&sn=d3a18f34320fa70d0e253cfa655e1738&chksm=bd495bdd8a3ed2cba1c919e533b1190252b93ff4d29d073d0f8e686aa854bca324faf5800604&scene=0&key=272a7504a5923c21c8d8f998255066c14929552b8a6c0f59fcdfc75a3e4411cbefffae7a151ff94af834c1b8f6dbc2105144958aa25e164b79b518940c04c4967ec20ab9a949510b14742ebd311662fd&ascene=0&uin=MTIzMDU5MTUzMg%3D%3D&devicetype=iMac+MacBookPro13%2C1+OSX+OSX+10.12.2+build(16C67)&version=12020810&nettype=WIFI&fontScale=100&pass_ticket=txhns3%2BDXhcfD35%2BwVrXzTPlUJqT2cu0TmRtu44KdVfDWg3dVntPTsZ3l3zamPqU';
// // const url = 'https://mp.weixin.qq.com/s?__biz=MjM5NjE5OTk2NA==&mid=2651020413&idx=1&sn=5bfdcc677a08c1b7535302c666454867&chksm=bd1b170e8a6c9e18381a0ef3190d74ad25d144b002e2cc2a8e40f9bcdd4101dd5cb89846c396&mpshare=1&scene=1&srcid=07189rKA2gH4UbDtJVaOCwnN&key=d1e338eab434b0b41d7802be607bbca8459b88f1e4c9252e6f8b5dafae8eca8f70bfd8a5d60b0a6849654c484b70787b2cbeeb44d3881b15ef4258ee28124084d8c12928147c296248485c2899fec35f&ascene=0&uin=MTIzMDU5MTUzMg%3D%3D&devicetype=iMac+MacBookPro13%2C1+OSX+OSX+10.12.2+build(16C67)&version=12020810&nettype=WIFI&fontScale=100&pass_ticket=txhns3%2BDXhcfD35%2BwVrXzTPlUJqT2cu0TmRtu44KdVfDWg3dVntPTsZ3l3zamPqU';
//
// this.handel(url).then(data => {
//   console.log(data.content)
// });


// const url = require('url');
// const {protocol, host, pathname} = url.parse('https://mmbiz.qpic.cn/mmbiz_jpg/meG6Vo0Mevg6SJZhosLG5upf1s7QkqIchxVRwInjJqMVEfLR7JAT0FGEMXqHic2iaosziclI4gE5Y3icqSZuUiba3Gg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1');
// const imgUrl = `${protocol}//${host}${pathname}`;
// let file;
// internal.handleImg(imgUrl).then(data => {
//   console.log(data);
//
// });
