import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
const src = fs.readFileSync('app.js', 'utf8');
const hash = crypto.createHash('sha1').update(src).digest('hex');
console.log(hash);
