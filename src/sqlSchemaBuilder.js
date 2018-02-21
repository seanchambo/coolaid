import knex from './connectors/database';

const generateField = (table, field) => {
  let newField;
  switch (field.getTypeName()) {
    case 'ID':
      newField = table.increments(field.getName());
      break;
    case 'String':
      newField = table.string(field.getName());
      break;
    case 'Int':
      newField = table.integer(field.getName());
      break;
    case 'Float':
      newField = table.float(field.getName());
      break;
    case 'DateTime':
      newField = table.dateTime(field.getName());
      break;
    case 'Boolean':
      newField = table.boolean(field.getName());
      break;
    default:
      throw new Error('Field is not scalar');
  }

  if (field.isRequired()) {
    newField = newField.notNullable();
  }

  if (field.hasDefaultValue()) {
    newField = newField.defaultTo(field.getDefaultValue());
  }

  return newField;
};

const generateUniqueConstraint = (table, constraint) => {
  table.unique(constraint.fields, constraint.name);
};

class SqlSchemaBuilder {
  constructor(document) {
    this.document = document;
  }

  generate() {
    return this.document.getObjectTypes().map(objectType =>
      knex.schema.createTable(objectType.getName(), (table) => {
        const scalarFields = objectType.getScalarTypeFields();

        scalarFields.forEach((field) => {
          generateField(table, field);
        });

        if (objectType.hasUniqueConstraints()) {
          const constraints = objectType.getUniqueConstraints();

          constraints.forEach((constraint) => {
            generateUniqueConstraint(table, constraint);
          });
        }

        table.timestamps();
      }).toString());
  }
}

export default SqlSchemaBuilder;
