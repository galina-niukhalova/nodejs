function replaceTemplate(temp, {
  image, productName, quantity, price, from, nutrients, description, organic, id,
}) {
  const output = temp
    .replace(/{%IMAGE%}/g, image)
    .replace(/{%PRODUCT_NAME%}/g, productName)
    .replace(/{%QUANTITY%}/g, quantity)
    .replace(/{%PRICE%}/g, price)
    .replace(/{%FROM%}/g, from)
    .replace(/{%NUTRIENCE%}/g, nutrients)
    .replace(/{%DESCRIPTION%}/g, description)
    .replace(/{%ID%}/g, id);

  if (!organic) {
    output.replace(/NOT_ORGANIC/, 'not-organic');
  }

  return output;
}

module.exports = replaceTemplate;
