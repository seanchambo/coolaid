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
  let newField = table.enu(field.getName(), field.getEnum().getValues());

  if (field.isRequired()) {
    newField = newField.notNullable();
  }

  if (field.hasDefaultValue()) {
    newField = newField.defaultTo(field.getDefaultValue());
  }

  return newField;
};

const generateRelationField = (table, field) => {
  let newField;
  if (field.isOneToOneRelation() || field.isOneToManyRelation()) {
    newField = table.integer(field.getName()).unsigned();
    table.foreign(field.getName()).references('id').inTable(field.getRelationTableName());

    if (field.isRequired()) {
      newField.notNullable();
    }

    if (field.hasDefaultValue()) {
      newField.defaultTo(field.getDefaultValue());
    }
  }

  return newField;
};

const generateUniqueConstraint = (table, constraint) => {
  table.unique(constraint.fields, constraint.name);
};

const generateObjectTypeTable = objectType =>
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
  }).toString();

const generateManyToManyTable = (field, alreadyGenerated) => {
  const relatedField = field.getRelation();
  const generateTable = (table) => {
    table.integer(field.objectType.getName()).unsigned().notNullable();
    table.foreign(field.objectType.getName()).references('id').inTable(field.objectType.getName());

    table.integer(relatedField.objectType.getName()).unsigned().notNullable();
    table.foreign(relatedField.objectType.getName()).references('id').inTable(relatedField.objectType.getName());
  };
  const checkAlreadyGenerated = (key) => {
    return Object.prototype.hasOwnProperty.call(alreadyGenerated, key);
  }

  if (field.hasRelationName() && !checkAlreadyGenerated(field.getRelationName())) {
    alreadyGenerated[field.getRelationName()] = true;
    return knex.schema.createTable(field.getRelationName(), (table) => {
      generateTable(table);
    }).toString();
  } else if (
    !field.hasRelationName() &&
    (
      !checkAlreadyGenerated(`${field.objectType.getName()}${relatedField.objectType.getName()}`) ||
      !checkAlreadyGenerated(`${relatedField.objectType.getName()}${field.objectType.getName()}`)
    )
  ) {
    alreadyGenerated[`${relatedField.objectType.getName()}${field.objectType.getName()}`] = true;
    return knex.schema.createTable(field.getRelationName(), (table) => {
      generateTable(table);
    }).toString();
  }
  return '';
};

class SqlSchemaBuilder {
  constructor(document) {
    this.document = document;
    this.manyToManyFields = [];
  }

  generateObjectTypeTables() {
    return this.document.getObjectTypes().map(objectType => {
      this.manyToManyFields = [
        ...this.manyToManyFields,
        ...objectType.getRelationFields().filter(field => field.isManyToManyRelation()),
      ];

      return generateObjectTypeTable(objectType)
    });
  }

  generateManyToManyTables() {
    const alreadyGenerated = {}
    return this.manyToManyFields.map(field => generateManyToManyTable(field, alreadyGenerated));
  }

  generate() {
    return [...this.generateObjectTypeTables(), ...this.generateManyToManyTables()];
  }
}

export default SqlSchemaBuilder;
