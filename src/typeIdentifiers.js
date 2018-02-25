import * as graphql from 'graphql';

const scalarTypes = [
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'ID',
  'Relation',
];

const isScalarType = name => scalarTypes.find(type => type === name);

const getGraphqlType = (typeName) => {
  let type;
  switch (typeName) {
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
  return type;
};

export { isScalarType, getGraphqlType };
