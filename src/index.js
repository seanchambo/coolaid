import { parse, Source, printSchema } from 'graphql';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import graphqlHTTP from 'express-graphql';

import Document from './models/Document';
import SqlSchemaGenerator from './generators/sql';
import GraphQLGenerator from './generators/graphql';

const parseSchema = async (fileName) => {
  fs.readFile(fileName, (err, contents) => {
    const source = new Source(contents);
    const document = new Document(parse(source));
    const sql = new SqlSchemaGenerator(document).generate().join(';\n');
    const schema = new GraphQLGenerator(document).generate();
    const schemaString = printSchema(schema);
    const projectRoot = `${path.dirname(__filename)}/..`;

    if (!fs.existsSync(`${projectRoot}/src/generated`)) {
      fs.mkdirSync(`${projectRoot}/src/generated`);
    }

    fs.writeFile(`${projectRoot}/src/generated/database.sql`, sql, () => {
      fs.writeFile(`${projectRoot}/src/generated/schema.graphql`, schemaString, () => {
        const app = express();
        app.use('/graphql', graphqlHTTP({
          schema,
          graphiql: true,
        }));

        app.listen(4000);
        console.log('Running a GraphQL API server at localhost:4000/graphql');
      });
    });
  });
};

export default parseSchema;
