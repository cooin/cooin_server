const fs = require('fs');
const config = require('../../../config/config');

fs.readFile('./coin.txt', function (err, data) {
  const str = data.toString();

  const array_str = str.split('\n');

  array_str.forEach(item => {
    if (item == '') return;
    const array = item.split(':');
    if (config.coin[array[0]]) config.coin[array[0]].intro = array[1];
  });

  console.log(JSON.stringify(config.coin));

});
