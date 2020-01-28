const fs = require('fs');
const http = require('http');
const url = require('url');

const tempOverview = fs.readFileSync(`${__dirname}/templates/template-overview.html`, 'utf-8');
const tempCard = fs.readFileSync(`${__dirname}/templates/template-card.html`, 'utf-8');
const tempProduct = fs.readFileSync(`${__dirname}/templates/template-product.html`, 'utf-8');

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

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

const cardsHTML = dataObj.map((product) => replaceTemplate(tempCard, product));
const overviewHTML = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHTML);

const server = http.createServer((req, res) => {
  // true = parseQueryString, query will be object instead of string
  const { query, pathname } = url.parse(req.url, true);

  // Overview page
  if (pathname === '/' || pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });

    res.end(overviewHTML);

  // Product page
  } else if (pathname === '/product') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    const productHTML = replaceTemplate(tempProduct, dataObj[query.id]);
    res.end(productHTML);

  // API
  } else if (pathname === '/api') {
    res.writeHead(200, {
      'Content-type': 'application/json',
    });
    res.end(data);

    // Not found
  } else {
    res.writeHead(404, {
      'Content-type': 'text/html',
      'my-own-header': 'hello-world',
    });
    res.end('<h1>Page not found!</h1>');
  }
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
