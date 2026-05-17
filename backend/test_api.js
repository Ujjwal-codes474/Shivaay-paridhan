const http = require('http');

// Test POST
const postData = JSON.stringify({
  name: 'Saree',
  price: 1200,
  image: 'images/clothing/saree1.jpg'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('POST Response:', data);
    
    // Now test GET
    http.get('http://localhost:5000/products', (res) => {
      let getdata = '';
      res.on('data', (chunk) => { getdata += chunk; });
      res.on('end', () => {
        console.log('GET Response:', getdata);
      });
    });
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
