import knex from './connectors/database';

const generateScalarField = (table, field) => {
  let newField;
  switch (field.getTypeName()) {
    case 'ID':
      newField = table.increments(field.getName());
      break;
    case 'String':
      newField = table.string(field.getName(), field.getMaxLength());
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

const generateEnumField = (table, field) => {
  let newField = table.enu(field.getName(), field.getEnum().getValues())

  if (field.isRequired()) {
    newField = newField.notNullable();
  }

  if (field.hasDefaultValue()) {
    newField = newField.defaultTo(field.getDefaultValue());
  }

  return newField;
}

const generateRelationField = (table, field) => {
  let newField;
  console.log(field.getName(), field.isOneToOneRelation(), field.isOneToManyRelation(), field.isManyToOneRelation(), field.isManyToManyRelation());

  if (field.isOneToOneRelation() || field.isOneToManyRelation()) {
    newField = table.integer(field.getName()).unsigned();
    table.foreign(field.getName()).references('id').inTable(field.getRelationTableName());

    if (field.isRequired()) {
      newField.notNullable();
    }

    if (field.hasDefaultValue()) {
      newField.defaultTo(field.getDefaultValue());
    }

    return newField;
  }
}

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
        const relationFields = objectType.getRelationFields();
        const enumFields = objectType.getEnumFields();

        scalarFields.forEach((field) => {
          generateScalarField(table, field);
        });

        enumFields.forEach((field) => {
          generateEnumField(table, field);
        });

        console.log(relationFields.map(field => field.getName()));

        relationFields.forEach((field) => {
          generateRelationField(table, field);
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
