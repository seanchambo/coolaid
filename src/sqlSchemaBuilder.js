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

const generateUniqueConstraint = (table, constraint) => {
  table.unique(constraint.fields, constraint.name);
};

const generateIndex = (table, index) => {
  table.index(index.fields, index.name, index.type);
};

const generateObjectTypeFields = (table, objectType) => {
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

const generateForeignKey = (table, field, referencedTable, isRequired) => {
  const newField = table
    .integer(field.getName())
    .unsigned();

  if (isRequired) {
    newField.notNullable();
  }

  table
    .foreign(field.getName())
    .references('id')
    .inTable(referencedTable.getName());
};

class SqlSchemaBuilder {
  constructor(document) {
    this.document = document;
  }

  generateObjectTypeSql() {
    return this.document.getObjectTypes().map(objectType =>
      knex.schema.createTable(objectType.getName(), (table) => {
        generateObjectTypeFields(table, objectType);
      }).toString());
  }

  generateRelationshipSql() {
    const relationships = this.document.getRelationships();

    return Object.keys(relationships).reduce((sqls, key) => {
      const relationship = relationships[key];

      if (relationship.isOneToOne()) {
        const aSide = knex.schema.table(relationship.objectTypeA.getName(), (table) => {
          const field = relationship.fieldA;
          const referencedTable = relationship.objectTypeB;
          generateForeignKey(table, field, referencedTable, field.isRequired());
        }).toString();

        const bSide = knex.schema.table(relationship.objectTypeB.getName(), (table) => {
          const field = relationship.fieldB;
          const referencedTable = relationship.objectTypeA;
          generateForeignKey(table, field, referencedTable, field.isRequired());
        }).toString();

        return [...sqls, aSide, bSide];
      }

      if (relationship.isOneToMany()) {
        const field = relationship.getForeignKey();
        const referencedTable = relationship.getForeignKeyTable();

        const sql = knex.schema.table(relationship.getForeignKeyTable().getName(), (table) => {
          generateForeignKey(table, field, referencedTable, field.isRequired());
        }).toString();

        return [...sqls, sql];
      }

      if (relationship.isManyToMany()) {
        const sql = knex.schema.createTable(relationship.getName(), (table) => {
          generateForeignKey(table, relationship.fieldA, relationship.objectTypeB, true);
          generateForeignKey(table, relationship.fieldB, relationship.objectTypeA, true);
        }).toString();

        return [...sqls, sql];
      }

      return sqls;
    }, []);
  }

  generate() {
    return [...this.generateObjectTypeSql(), ...this.generateRelationshipSql()];
  }
}

export default SqlSchemaBuilder;
