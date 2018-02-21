import { parse, Source } from 'graphql';
import * as fs from 'fs';

import { Document } from './nodeExtensions';
import SqlSchemaBuilder from './sqlSchemaBuilder';

const parseSchema = async (fileName) => {
  fs.readFile(fileName, (err, contents) => {
    const source = new Source(contents);
    const document = new Document(parse(source));

    new SqlSchemaBuilder(document).generate();
  });
};

export default parseSchema;
