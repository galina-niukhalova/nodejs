const fs = require('fs');

setTimeout(() => {
  console.log('Timer 1 finished'); // 2
}, 0);

setImmediate(() => {
  console.log('Immediate 1 finished'); // 3
});


fs.readFile('txt/test-file.txt', () => {
  console.log('I/O finished'); // 4

  setTimeout(() => {
    console.log('Timer 2 finished'); // 6
  }, 0);

  setImmediate(() => {
    console.log('Immediate 3 finished'); // 5
  });

  setImmediate(() => {
    console.log('Immediate 2 finished'); // 5
  });
});

console.log('Hello from the top lavel code'); // 1
