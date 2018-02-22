import ObjectType from './ObjectType';
import EnumType from './EnumType';
import Relation from './Relation';

class Document {
  constructor(document) {
    this.document = document;

    this.objectTypes = this.document.definitions
      .filter(definition => definition.kind === 'ObjectTypeDefinition')
      .map(objectType => new ObjectType(this, objectType));

    this.enumTypes = this.document.definitions
      .filter(definition => definition.kind === 'EnumTypeDefinition')
      .map(enumType => new EnumType(this, enumType));
  }

  getObjectTypes() {
    return this.objectTypes;
  }
  getObjectType(name) {
    return this.getObjectTypes().find(objectType => objectType.getName() === name);
  }
  objectTypeNames() {
    return this.getObjectTypes().map(objectType => objectType.getName());
  }

  getEnumTypes() {
    return this.enumTypes;
  }
  getEnumType(name) {
    return this.getEnumTypes().find(enumType => enumType.getName() === name);
  }
  enumTypeNames() {
    return this.getEnumTypes().map(enumType => enumType.getName());
  }

  isObjectOrEnumType(name) {
    return this.getObjectType(name) || this.getEnumType(name);
  }

  enumFieldOf(fieldDefinition) {
    return this.getEnumType(fieldDefinition.getTypeName());
  }

  getRelationships() {
    const hierarchy = this.getRelationshipsHierarchy();

    return Object.keys(hierarchy).reduce((acc, key) => {
      const objectTypeA = this.getObjectType(key);
      const fields = hierarchy[key];

      const relations = Object.keys(fields).reduce((acc1, fieldName) => {
        const fieldA = objectTypeA.getField(fieldName);
        const objectTypeB = this.getObjectType(fields[fieldName].type);
        const relationName = fields[fieldName].name;
        const potentialFields = objectTypeB.findRelatedFields(objectTypeA, fieldA, relationName);

        if (potentialFields.length < 1) {
          throw new Error(`Can't find matching field on table ${objectTypeB.getName()} for field ${fieldA.getName()}`);
        }
        if (potentialFields.length > 1) {
          throw new Error(`Ambigious relationships on tables ${objectTypeB.getName()} and ${objectTypeA.getName()}`);
        }

        const fieldB = potentialFields[0];

        const relation = new Relation(objectTypeA, fieldA, objectTypeB, fieldB, relationName);

        return { ...acc1, [relation.getName()]: relation };
      }, {});

      return { ...acc, ...relations };
    }, {});
  }

  getRelationshipsHierarchy() {
    return this.getObjectTypes().reduce((hierarchy, objectType) => {
      const fieldHierarchy = objectType.getRelationFields().reduce((acc, field) => {
        const fieldInfo = {
          type: field.getRelationTableName(),
          name: field.getRelationDirectiveName(),
          isList: field.isList(),
        };

        return { ...acc, [field.getName()]: fieldInfo };
      }, {});

      return { ...hierarchy, [objectType.getName()]: fieldHierarchy };
    }, {});
  }
}

export default Document;
