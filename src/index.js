import { parse, Source } from 'graphql';
import * as fs from 'fs';
import * as path from 'path';

import { Document } from './nodeExtensions';
import SqlSchemaBuilder from './sqlSchemaBuilder';

const parseSchema = async (fileName) => {
  fs.readFile(fileName, (err, contents) => {
    const source = new Source(contents);
    const document = new Document(parse(source));
    const sql = new SqlSchemaBuilder(document).generate().join('\n');
    const projectRoot = `${path.dirname(__filename)}/..`;

    if (!fs.existsSync(`${projectRoot}/src/generated`)) {
      fs.mkdirSync(`${projectRoot}/src/generated`);
    }

    fs.writeFile(`${path.dirname(__filename)}/../src/generated/database.sql`, sql, { flag: 'w' });
  });
};

export default parseSchema;
