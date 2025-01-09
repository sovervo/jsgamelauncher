import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import parseCfg from './parse_cfg.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlFile = path.join(__dirname, './es_input.cfg')

async function createDb() {
  const cfgList = await parseCfg(xmlFile);
  fs.writeFileSync(path.join(__dirname, './db.json'), JSON.stringify(cfgList));
  return cfgList;
}

createDb()
  .then(() => {
    console.log('db.json created');
  })
  .catch((err) => {
    console.error('error creating db.json', err);
  });
