import { isScalarType as checkIsScalarType } from './typeIdentifiers';

const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

class Relation {
  constructor(objectTypeA, fieldA, objectTypeB, fieldB, name) {
    this.objectTypeA = objectTypeA;
    this.objectTypeB = objectTypeB;
    this.fieldA = fieldA;
    this.fieldB = fieldB;
    this.name = name;
  }

  isOneToOne() {
    return !this.fieldA.isList() && !this.fieldB.isList();
  }

  isOneToMany() {
    return (!this.fieldA.isList() && this.fieldB.isList()) ||
      (this.fieldA.isList() && !this.fieldB.isList());
  }

  getForeignKey() {
    return this.fieldA.isList() ? this.fieldA : this.fieldB;
  }

  getForeignKeyTable() {
    return this.fieldA === this.getForeignKey() ? this.objectTypeA : this.objectTypeB;
  }

  getOppositeForeignKeyTable() {
    return this.getForeignKeyTable() === this.objectTypeA ? this.objectTypeB : this.objectTypeA;
  }

  isManyToMany() {
    return this.fieldA.isList() && this.fieldB.isList();
  }

  getName() {
    if (this.name) { return this.name; }

    if (this.isOneToOne()) {
      return [
        capitalizeFirstLetter(this.fieldA.getName()),
        capitalizeFirstLetter(this.fieldB.getName()),
      ].sort().join('');
    }
    if (this.isOneToMany()) {
      if (this.getForeignKey() === this.fieldA) {
        return [
          capitalizeFirstLetter(this.objectTypeA.getName()),
          capitalizeFirstLetter(this.fieldA.getName()),
        ].join('');
      }
      return [
        capitalizeFirstLetter(this.objectTypeB.getName()),
        capitalizeFirstLetter(this.fieldB.getName()),
      ].join('');
    }

    return [
      capitalizeFirstLetter(this.objectTypeA.getName()),
      capitalizeFirstLetter(this.objectTypeB.getName()),
    ].sort().join('');
  }

  hasField(field) {
    return this.fieldA === field || this.fieldB === field;
  }

  hasObjectType(objectType) {
    return this.objectTypeA === objectType || this.objectTypeB === objectType;
  }
}

class Argument {
  constructor(argument) {
    this.argument = argument;
  }

  getName() {
    return this.argument.name.value;
  }

  getValue() {
    return this.argument.value;
  }
}

class Directive {
  constructor(directive) {
    this.directive = directive;
  }

  getName() {
    return this.directive.name.value;
  }

  getArguments() {
    return this.directive.arguments.map(argument => new Argument(argument));
  }
  getArgument(name) {
    return this.getArguments().find(argument => argument.getName() === name);
  }
}

class Field {
  constructor(document, objectType, field) {
    this.document = document;
    this.objectType = objectType;
    this.field = field;
  }

  getName() {
    return this.field.name.value;
  }

  getType() {
    if (this.isRequired()) {
      return this.isList() ? this.field.type.type.type.type : this.field.type.type;
    }
    return this.field.type;
  }
  getTypeName() {
    return this.getType().name.value;
  }

  isScalarType() {
    return !!checkIsScalarType(this.getTypeName());
  }
  isRequired() {
    return this.field.type.kind === 'NonNullType';
  }
  isList() {
    return this.isRequired() ? this.field.type.type.kind === 'ListType' : this.field.type.kind === 'ListType';
  }
  isEnum() {
    return !!this.document.enumFieldOf(this);
  }
  getEnum() {
    return this.document.enumFieldOf(this);
  }
  isRelation() {
    return !!this.document.getObjectTypes().find(objectType =>
      objectType.getName() === this.getTypeName());
  }
  getRelationTableName() {
    return this.document.getObjectTypes().find(objectType =>
      objectType.getName() === this.getTypeName()).getName();
  }

  getDirectives() {
    return this.field.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().find(directive => directive.getName() === name);
  }

  hasDefaultValue() {
    return !!this.getDirective('default');
  }
  getDefaultValue() {
    return this.getDirective('default').getArgument('value').getValue().value;
  }

  hasMaxLength() {
    return !!this.getDirective('maxLength');
  }
  getMaxLength() {
    return this.hasMaxLength() ?
      this.getDirective('maxLength').getArgument('value').getValue().value : 255;
  }

  hasRelationDirective() {
    return !!this.getDirective('relation');
  }
  hasRelationDirectiveName() {
    return !!(this.hasRelationDirective() && this.getDirective('relation').getArgument('name'));
  }
  getRelationDirectiveName() {
    if (this.hasRelationDirective() && this.getDirective('relation').getArgument('name')) {
      return this.getDirective('relation').getArgument('name').getValue().value;
    }
    return null;
  }
}

class ObjectType {
  constructor(document, objectType) {
    this.document = document;
    this.objectType = objectType;
  }

  getName() {
    return this.objectType.name.value;
  }

  getDirectives() {
    return this.objectType.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().find(directive => directive.getName() === name);
  }

  getFields() {
    return this.objectType.fields.map(field => new Field(this.document, this, field));
  }
  getField(name) {
    return this.getFields().find(field => field.getName() === name);
  }
  getScalarTypeFields() {
    return this.getFields().filter(field => field.isScalarType());
  }
  getEnumFields() {
    return this.getFields().filter(field => field.isEnum());
  }
  getRelationships() {
    const relationships = this.document.getRelationships();

    return Object.keys(relationships).reduce((acc, key) => {
      const relationship = relationships[key];

      if (relationship.hasObjectType(this)) {
        return [...acc, relationship];
      }

      return acc;
    }, []);
  }
  getRelationFields() {
    return this.getFields().filter(field => field.isRelation());
  }
  findRelatedFields(objectType, relationName) {
    let potentialFields = this.getRelationFields().filter(field =>
      field.getTypeName() === objectType.getName());

    if (relationName) {
      potentialFields = potentialFields.filter(field =>
        field.getRelationDirectiveName() === relationName);
    }

    return potentialFields;
  }

  hasOptions() {
    return !!this.getDirective('options');
  }
  hasIndexes() {
    return this.hasOptions() && !!this.getOption('indexes');
  }
  hasConstraints() {
    return this.hasOptions() && !!this.getOption('constraints');
  }
  hasUniqueConstraints() {
    return this.hasConstraints() && !!this.getConstraint('unique');
  }
  getOptions() {
    return this.getDirective('options').getArguments();
  }
  getOption(name) {
    return this.getOptions().find(option => option.getName() === name);
  }
  getConstraints() {
    return this.getOption('constraints').getValue().fields;
  }
  getConstraint(name) {
    return this.getConstraints().find(constraintType => constraintType.name.value === name);
  }
  getIndexes() {
    return this.getOption('indexes').getValue().values.map((index) => {
      const data = {};
      const name = index.fields.find(field => field.name.value === 'name');
      const fields = index.fields.find(field => field.name.value === 'fields');
      const type = index.fields.find(field => field.name.value === 'type');

      if (name) {
        data.name = name.name.value;
      }
      if (type) {
        data.type = type.name.value;
      }
      data.fields = fields.value.values.map(value => value.value);

      return data;
    });
  }
  getUniqueConstraints() {
    return this.getConstraint('unique').value.values.map((constraint) => {
      const data = {};
      const name = constraint.fields.find(field => field.name.value === 'name');
      const fields = constraint.fields.find(field => field.name.value === 'fields');

      if (name) {
        data.name = name.name.value;
      }
      data.fields = fields.value.values.map(value => value.value);

      return data;
    });
  }
}

class EnumType {
  constructor(document, enumType) {
    this.document = document;
    this.enumType = enumType;
  }

  getName() {
    return this.enumType.name.value;
  }

  getDirectives() {
    return this.enumType.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().find(directive => directive.getName() === name);
  }

  getValues() {
    return this.enumType.values.map(value => value.name.value);
  }
  getValue(name) {
    return this.getValues().find(value => value === name);
  }
}

class Document {
  constructor(document) {
    this.document = document;
  }

  getObjectTypes() {
    return this.document.definitions
      .filter(definition => definition.kind === 'ObjectTypeDefinition')
      .map(objectType => new ObjectType(this, objectType));
  }
  getObjectType(name) {
    return this.getObjectTypes().find(objectType => objectType.getName() === name);
  }
  objectTypeNames() {
    return this.getObjectTypes().map(objectType => objectType.getName());
  }

  getEnumTypes() {
    return this.document.definitions
      .filter(definition => definition.kind === 'EnumTypeDefinition')
      .map(enumType => new EnumType(this, enumType));
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
        const potentialFields = objectTypeB.findRelatedFields(objectTypeA, relationName);

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

export { Document, ObjectType, EnumType, Field, Directive, Argument };
