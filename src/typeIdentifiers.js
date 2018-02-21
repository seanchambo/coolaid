const scalarTypes = [
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'ID',
  'Relation'
];

const isScalarType = name => scalarTypes.find((type) => type === name);

export { isScalarType };
