const fs = require('fs');
const crypto = require('crypto');

const date = new Date();

// Out of the event loop
setTimeout(() => console.log('Timer 1 finished'), 0);
setImmediate(() => console.log('Immediate 1 finished'));

fs.readFile('test-file.txt', () => {
  // As soon as file will be read
  console.log('I/O finished');
  console.log('----------------');

  // Next tick
  setTimeout(() => console.log('Timer 2 finished'), 0);
  setTimeout(() => console.log('Timer 3 finished'), 3000);
  // Right after I/O
  setImmediate(() => console.log('Immediate 2 finished'));

  process.nextTick(() => {
    console.log('Process.nextTick 1');
  });

  crypto.pbkdf2('password', 'salt', 100000, 1024, 'sha512', () => {
    console.log('Password encrypted');
  });
});

// TOP level first
console.log('Hello from the top-level code');
