const fs = require('fs');

fs.readdir('./logo', function (err, files) {
  console.log(files.length);

  files.forEach(file => {
    // const array = file.split('_');
    // const name = config.coin[array[0]].code + '_' + array[1];
    // fs.rename('./temp/' + file, './temp/' + name);

    const name = file.replace(/^(.*)@2x\.png/, '$1.png');
    fs.rename('./logo/' + file, './logo/' + name, () => {});

  })

});
