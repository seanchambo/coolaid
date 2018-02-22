import knex from '../../connectors/database';
import generateForeignKey from './foreignKey';
import generateTable from './table';


class SqlSchemaBuilder {
  constructor(document) {
    this.document = document;
  }

  generateObjectTypeSql() {
    return this.document.getObjectTypes().map(objectType =>
      knex.schema.createTable(objectType.getName(), (table) => {
        generateTable(table, objectType);
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

        if (relationship.isSelfReferencing()) {
          return [...sqls, aSide];
        }

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
