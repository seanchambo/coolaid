import { generateIndex, generateUniqueConstraint } from './indexes';
import generateScalarField from './scalarField';
import generateEnumField from './enumField';

const generateTable = (table, objectType) => {
  const scalarFields = objectType.getScalarTypeFields();
  const enumFields = objectType.getEnumFields();

  scalarFields.forEach((field) => {
    generateScalarField(table, field);
  });

  enumFields.forEach((field) => {
    generateEnumField(table, field);
  });

  if (objectType.hasUniqueConstraints()) {
    const constraints = objectType.getUniqueConstraints();

    constraints.forEach((constraint) => {
      generateUniqueConstraint(table, constraint);
    });
  }

  if (objectType.hasIndexes()) {
    const indexes = objectType.getIndexes();

    indexes.forEach((index) => {
      generateIndex(table, index);
    });
  }

  table.timestamps();
};

export default generateTable;
