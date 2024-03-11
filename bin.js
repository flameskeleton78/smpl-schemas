const laziness = require('./index.js');
const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines = [];

rl.on('line', l => lines.push(l));

rl.on('close', function () {
    const src = JSON.parse(lines.join('\n'));
    console.log(JSON.stringify(laziness(src)));
});