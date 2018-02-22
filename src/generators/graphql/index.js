import * as graphql from 'graphql';

import knex from '../../connectors/database';

class GraphQLGenerator {
  constructor(document) {
    this.document = document;
    this.objectTypes = {};
    this.objectTypeFields = {};
  }

  generate() {
    this.generateObjectTypes();
    this.generateObjectTypesFields();
    const queryType = this.generateQueryType();

    return new graphql.GraphQLSchema({ query: queryType });
  }

  generateQueryType() {
    return new graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => this.document.getObjectTypes().reduce((acc, objectType) => {
        const singular = {
          type: this.objectTypes[objectType.getName()],
          args: { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLInt) } },
          resolve: (_, args) => knex(objectType.getName()).where({ id: args.id }).first(),
        };

        const plural = {
          type: new graphql.GraphQLList(this.objectTypes[objectType.getName()]),
          resolve: () => knex(objectType.getName()),
        };

        return {
          ...acc,
          [objectType.getName()]: singular,
          [objectType.getPlural()]: plural,
        };
      }, {}),
    });
  }

  generateObjectTypes() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectType(objectType);
    });
  }

  generateObjectType(objectType) {
    this.objectTypes[objectType.getName()] = new graphql.GraphQLObjectType({
      name: objectType.getName(),
      fields: () => this.objectTypeFields[objectType.getName()],
    });
  }

  generateObjectTypesFields() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectTypeFields(objectType);
    });
  }

  generateObjectTypeFields(objectType) {
    this.objectTypeFields[objectType.getName()] =
      objectType.getScalarTypeFields().reduce((acc, field) => {
        let type;
        switch (field.getTypeName()) {
          case 'ID':
            type = graphql.GraphQLInt;
            break;
          case 'String':
            type = graphql.GraphQLString;
            break;
          case 'Int':
            type = graphql.GraphQLInt;
            break;
          case 'Float':
            type = graphql.GraphQLFloat;
            break;
          case 'DateTime':
            // TODO: Implement datetime type
            break;
          case 'Boolean':
            type = graphql.GraphQLBoolean;
            break;
          default:
            throw new Error('Field is not scalar');
        }

        return { ...acc, [field.getName()]: { type } };
      }, {});
  }
}

export default GraphQLGenerator;
