const fs = require('fs');
const config = require('../config/config');

// fs.readdir('./temp/coinExchange/logo', function (err, files) {
//   console.log(files);
//
//   files.forEach(file => {
//     const name = file.replace(/^(.*)@2x\.png/, '$1.png');
//     fs.rename('./temp/coinExchange/logo/' + file, './temp/coinExchange/logo/' + name, () => {});
//   })
//
// });

fs.readdir('./temp/coinExchange/logo', function (err, files) {
  console.log(files);

  files.forEach(file => {
    const array = file.split('_');
    const name = config.coin[array[0]].code + '_' + array[1];
    fs.rename('./temp/coinExchange/logo/' + file, './temp/coinExchange/logo/' + name, () => {});
  })

});
