const sharp = require("sharp");
const fs = require("fs");

const svg = fs.readFileSync("icon.svg");

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`images/icon-${size}.png`, (err, info) => {
      if (err) console.error(err);
      else console.log(`Generated icon-${size}.png`);
    });
});
