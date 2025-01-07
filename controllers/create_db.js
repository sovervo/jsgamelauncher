import { XMLParser } from 'fast-xml-parser';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const parser = new XMLParser();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlFile = fs.readFileSync(path.join(__dirname, './es_input.cfg'), 'utf8');
const jsobj = parser.parse(xmlFile);
// console.log(JSON.stringify(jsobj));

const parser2 = new xml2js.Parser();
parser2.parseString(xmlFile, (err, result) => {
  // const jsonObj = JSON.parse(result);
  console.log(JSON.stringify(result, null, 2));
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
  console.log(outputList);
});

