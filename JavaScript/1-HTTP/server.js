'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

global.memory = new Map();
const api = new Map();

const apiPath = './api/';

const cacheFile = name => {
  const filePath = apiPath + name;
  const key = path.basename(filePath, '.js');
  try {
    const libPath = require.resolve(filePath);
    delete require.cache[libPath];
  } catch (e) {
    return;
  }
  try {
    const method = require(filePath);
    api.set(key, method);
  } catch (e) {
    cache.delete(name);
  }
};

const cacheFolder = path => {
  fs.readdir(path, (err, files) => {
    if (err) return;
    files.forEach(cacheFile);
  });
};

const watch = path => {
  fs.watch(path, (event, file) => {
    cacheFile(file);
  });
};

cacheFolder(apiPath);
watch(apiPath);

setTimeout(() => {
  console.dir({ api });
}, 1000);

http.createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const [s, folder, file] = url.split('/');
  if (folder === 'api') {
    const method = api.get(file);
    const body = [];
    req.on('data', chunk => {
      body.push(chunk);
    }).on('end', async () => {
      const data = body.join('');
      const args = JSON.parse(data);
      try {
        const result = await method(...args);
        if (!result) {
          res.statusCode = 500;
          res.end('"Server error"');
          return;
        }
        res.end(JSON.stringify(result));
      } catch (err) {
        console.dir({ err });
        res.statusCode = 500;
        res.end('"Server error"');
      }
    });
  } else {
    const path = `./static/${folder}`;
    try {
      const data = await fs.promises.readFile(path);
      res.end(data);
    } catch (err) {
      res.statusCode = 404;
      res.end('"File is not found"');
    }
  }
}).listen(8000);
