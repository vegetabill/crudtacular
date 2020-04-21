function keyBy(array, propName) {
  return array.reduce((map, item) => {
    map.set(item[propName], item);
    return map;
  }, new Map());
}

module.exports = {
  keyBy
};
