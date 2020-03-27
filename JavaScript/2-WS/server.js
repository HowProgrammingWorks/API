'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const Websocket = require('websocket').server;

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
    api.delete(key);
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

const server = http.createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const [file] = url.substring(1).split('/');
  const path = `./static/${file}`;
  try {
    const data = await fs.promises.readFile(path);
    res.end(data);
  } catch (err) {
    res.statusCode = 404;
    res.end('"File is not found"');
  }
}).listen(8000);

const ws = new Websocket({
  httpServer: server,
  autoAcceptConnections: false
});

ws.on('request', req => {
  const connection = req.accept('', req.origin);
  console.log('Connected ' + connection.remoteAddress);
  connection.on('message', async message => {
    const dataName = message.type + 'Data';
    const data = message[dataName];
    console.log('Received: ' + data);
    const obj = JSON.parse(data);
    const { method, args } = obj;
    const fn = api.get(method);
    try {
      const result = await fn(...args);
      if (!result) {
        connection.send('"No result"');
        return;
      }
      connection.send(JSON.stringify(result));
    } catch (err) {
      console.dir({ err });
      connection.send('"Server error"');
    }
  });
});
