"use strict";

let gg = {
  m: () => 1,
  s: function (h) {
    const m = /(..)(.)$/.exec(h);
    return parseInt(m[2] + m[1], 16).toString(10);
  },
  b: '1659942002/',
};

function init(newGg) {
  gg = newGg;
}

function subdomain_from_url(url, base) {
  let retval = 'b';
  if (base) {
    retval = base;
  }

  const b = 16;

  const r = /\/[0-9a-f]{61}([0-9a-f]{2})([0-9a-f])/;
  const m = r.exec(url);
  if (!m) {
    return 'a';
  }

  const g = parseInt(m[2] + m[1], b);
  if (!isNaN(g)) {
    retval = String.fromCharCode(97 + gg.m(g)) + retval;
  }

  return retval;
}

function url_from_url(url, base) {
  return url.replace(/\/\/..?\.hitomi\.la\//, '//' + subdomain_from_url(url, base) + '.hitomi.la/');
}


function full_path_from_hash(hash) {
  return gg.b + gg.s(hash) + '/' + hash;
}

function real_full_path_from_hash(hash) {
  return hash.replace(/^.*(..)(.)$/, '$2/$1/' + hash);
}


function url_from_hash(galleryid, image, dir, ext) {
  ext = ext || dir || image.name.split('.').pop();
  dir = dir || 'images';

  return 'https://a.hitomi.la/' + dir + '/' + full_path_from_hash(image.hash) + '.' + ext;
}

function url_from_url_from_hash(galleryid, image, dir, ext, base) {
  if ('tn' === base) {
    return url_from_url('https://a.hitomi.la/' + dir + '/' + real_full_path_from_hash(image.hash) + '.' + ext, base);
  }
  return url_from_url(url_from_hash(galleryid, image, dir, ext), base);
}

function rewrite_tn_paths(html) {
  return html.replace(/\/\/tn\.hitomi\.la\/[^\/]+\/[0-9a-f]\/[0-9a-f]{2}\/[0-9a-f]{64}/g, function (url) {
    return url_from_url(url, 'tn');
  });
}

function sanitize_gallery_title(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

module.exports = {
  init,
  url_from_url_from_hash,
};