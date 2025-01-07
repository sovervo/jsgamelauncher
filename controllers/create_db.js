import xml2js from 'xml2js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlFile = fs.readFileSync(path.join(__dirname, './es_input.cfg'), 'utf8');


const parser = new xml2js.Parser();
parser.parseString(xmlFile, (err, result) => {
  const { inputList } = result;
  const outputList = inputList.inputConfig.map((ic) => {
    return {
      name: ic['$'].deviceName.trim(), // no idea why some have trailing spaces
      type: ic['$'].type,
      guid: ic['$'].deviceGUID,
      input: ic.input.map((i) => {
        return i['$'];
      }),
    };
  });
  fs.writeFileSync(path.join(__dirname, './db.json'), JSON.stringify(outputList));
});

