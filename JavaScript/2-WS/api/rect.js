'use strict';

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Rect {
  constructor(x1, y1, x2, y2) {
    this.a = new Point(x1, y1);
    this.b = new Point(x2, y1);
    this.c = new Point(x2, y2);
    this.d = new Point(x1, y2);
  }
}

module.exports = async (name, x1, y1, x2, y2) => {
  const rect = new Rect(x1, y1, x2, y2);
  memory.set(name, rect);
  return 'ok';
};
