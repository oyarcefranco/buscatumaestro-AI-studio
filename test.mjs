import { pathToFileURL } from 'url';
import fs from 'fs';
const path = './dist/assets/' + fs.readdirSync('./dist/assets').find(f => f.endsWith('.js'));
const jsUrl = pathToFileURL(path).href;

console.log('Testing JS File:', path);
import(jsUrl).then(m => {
  console.log('Successfully loaded JS module');
}).catch(e => {
  console.error('Failed to load JS module:', e);
});
