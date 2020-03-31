module.exports = (fn) => (req, resp, next) => {
  fn(req, resp, next).catch(next);
};
