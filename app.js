const axios = require('axios');
const hitomiUtil = require('./hitomi-utils.js');
const fs = require('fs');
const path = require('path');

const $http = axios.create({
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36",
    referer: "https://hitomi.la/",
  },
  withCredentials: true,
  validateStatus: null,
  timeout: 60000,
});

async function getGalleries(nozomiIndex) {
  let res = await $http.get(nozomiIndex, {
    responseType: "arraybuffer"
  });

  if (res.status !== 200) {
    console.error(res.statusText);
    throw new Error(res);
  }

  const view = new DataView(new Uint8Array(res.data).buffer);
  const total = view.byteLength / 4;
  const list = [];
  for (let i = 0; i < total; i++) {
    list.push(view.getInt32(i * 4, false /* big-endian */));
  }

  return list;
}

async function getGalleryInfo(galleryId) {
  let res = await $http.get(`https://ltn.hitomi.la/galleries/${galleryId}.js`);

  if (res.status !== 200) {
    console.error(res.statusText);
    throw new Error(res);
  }

  const galleryInfo = JSON.parse(
    res.data.replace(/^[^{]*?{/g, '{').replace(/}[^}]*$/g, '}')
  );

  return galleryInfo;
}

async function downloadImage(target, galleryId, file, ext, base) {
  ext = ext || 'webp';
  base = base || 'a';
  const fetchUrl = hitomiUtil.url_from_url_from_hash(
    galleryId, file, ext, undefined, base
  );

  let res = await $http.get(fetchUrl, {
    responseType: 'stream'
  });

  if (res.status === 200) {
    const writer = fs.createWriteStream(target);
    res.data.pipe(writer);

    await new Promise((done, fail) => {
      writer.on("finish", done);
      writer.on("error", fail);
    });
  } else {
    throw new Error(res.statusText);
  }
}

async function reset() {
  let ggData = (await $http.get('https://ltn.hitomi.la/gg.js')).data;
  const gg = (new Function(ggData.replaceAll("gg =", "return")))();

  hitomiUtil.init(gg);
}

(async () => {
  await reset();
  const timer = setInterval(() => reset(), 60 * 60 * 1000);

  let list = await getGalleries("https://ltn.hitomi.la/tag/male:furry-all.nozomi");

  for (const galleryId of list) {
    const galleryInfo = await getGalleryInfo(galleryId);
    console.log(`Fetch ${galleryId}: ${galleryInfo.title} - ${galleryInfo.language}`);

    const galleryDir = `./data/[${galleryId}] ${galleryInfo.title} - ${galleryInfo.language}`;
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }

    fs.writeFileSync(`${galleryDir}/metadata.json`, JSON.stringify(galleryInfo, null, 2), { encoding: 'utf-8' });

    for (const file of galleryInfo.files) {
      const ext = 'webp';
      const target = `${galleryDir}/${file.name.replace(/\.[^\.]+$/, '.' + ext)}`;
      if (!fs.existsSync(target)) {
        try {
          await downloadImage(target, galleryId, file, ext);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  clearInterval(timer);
})();