import { parse, Source } from 'graphql';
import * as fs from 'fs';

import { Document } from './nodeExtensions';

// const types = {};

const parseSchema = async (fileName) => {
  fs.readFile(fileName, (err, contents) => {
    const source = new Source(contents);
    const document = new Document(parse(source));

    document.getObjectTypes().forEach((objectType) => {
      console.log(objectType.getName());
      objectType.getFields().forEach((field) => {
        console.log(field.getName());
        console.log(field.getTypeName());
        console.log(field.isScalarType());
      });
    });

    document.getEnumTypes().forEach((enumType) => {
      console.log(enumType.getName());
      console.log(enumType.getValues());
    });

  //   document.definitions.forEach((definition) => {
  //     console.log(definition);
  //     switch (definition.kind) {
  //       case 'ObjectTypeDefinition':
  //         types[definition.name.value] = definition;
  //         break;
  //       default:
  //         break;
  //     }
  //   });
  //
  //   console.log(types);
  //
  //   const sqlFile = document.definitions.map(definition => makeSqlFromObjectTypeDefinition(definition)).join('\n\n');
  //   console.log(sqlFile);
  });
};

// const graphqlToSqlType = {
//   ID: 'MEDIUMINT',
//   String: 'VARCHAR',
//   Int: 'INT',
//   DateTime: 'DATETIME',
// };
//
// const makeSqlFromObjectTypeDefinition = (definition) => {
//   const sqlFieldsString = definition.fields.map(field => makeSqlFromFieldDefinition(field));
//   const sqlDirectivesString = definition.directives.map(directive => makeSqlFromObjectTypeDefinitionDirective(directive));
//   const innerTableSqlString = [...sqlFieldsString, ...sqlDirectivesString].join(',\n');
//
//   return `CREATE TABLE ${definition.name.value} (${innerTableSqlString});`;
// }
//
// const makeSqlFromFieldDefinition = (definition) => {
//   console.log(definition);
//   const fieldName = definition.name.value;
//   const isRequired = definition.type.kind === 'NonNullType';
//   const type = isRequired ? definition.type.type.name.value : definition.type.name.value;
//
//   const isId = type === 'ID';
//
//   return `${fieldName} ${sqlType}${isRequired || isId ? ' NOT NULL' : ''}${isId ? ' AUTO_INCREMENT' : ''}`;
// }
//
// const makeSqlFromObjectTypeDefinitionDirective = (directive) => {
//   let sqlString;
//   switch (directive.name.value) {
//     case 'constraints':
//       sqlString = makeSqlFromConstraintDirective(directive);
//       break;
//     default:
//       sqlString = '';
//   }
//   return sqlString;
// }
//
// const makeSqlFromConstraintDirective = (directive) => {
//   return directive.arguments.map((constraintType) => {
//     let sqlString;
//     switch (constraintType.name.value) {
//       case 'unique':
//         sqlString = makeSqlFromUniqueConstraintType(constraintType);
//         break;
//       default:
//         sqlString = ''
//     }
//     return sqlString;
//   })
// }
//
// const makeSqlFromUniqueConstraintType = (uniqueConstraintType) => {
//   return uniqueConstraintType.value.values.map((constraint) => {
//     let constraintName;
//     let constraintFields;
//     constraint.fields.forEach((field) => {
//       switch (field.name.value) {
//         case 'name':
//           constraintName = field.value.value;
//           break;
//         case 'fields':
//           constraintFields = field.value.values.map(value => value.value).join(',');
//           break;
//         default:
//           return '';
//       }
//     });
//     return `CONSTRAINT ${constraintName} UNIQUE (${constraintFields})`;
//   });
// }

export default parseSchema;
