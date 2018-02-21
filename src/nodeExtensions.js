import { isScalarType as checkIsScalarType } from './typeIdentifiers';

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
    return this.isRequired() ? (
      this.isList() ? this.field.type.type.type.type : this.field.type.type
    ) : this.field.type;
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
    return !!this.document.enumFieldOf(this)
  }
  getEnum() {
    return this.document.enumFieldOf(this);
  }
  isRelation() {
    return !!this.document.relatedFieldOf(this.objectType, this);
  }
  getRelation() {
    return this.document.relatedFieldOf(this.objectType, this);
  }
  getRelationTableName() {
    return this.getRelation().objectType.getName();
  }
  isOneToOneRelation() {
    return !this.isList() && !this.getRelation().isList();
  }
  isOneToManyRelation() {
    return !this.isList() && this.getRelation().isList();
  }
  isManyToOneRelation() {
    return this.isList() && !this.getRelation().isList();
  }
  isManyToManyRelation() {
    return this.isList() && this.getRelation().isList();
  }

  getDirectives() {
    return this.field.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().find(directive => directive.getName() === name);
  }

  hasDefaultValue() {
    return !!this.getDirective('defaultValue');
  }
  getDefaultValue() {
    return this.getDirective('defaultValue').getArgument('value').getValue().value;
  }

  hasMaxLength() {
    return !!this.getDirective('maxLength');
  }
  getMaxLength() {
    return this.hasMaxLength() ?
      this.getDirective('maxLength').getArgument('value').getValue().value : 255;
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
  getRelationFields() {
    return this.getFields().filter(field => field.isRelation());
  }

  hasConstraints() {
    return !!this.getDirective('constraints');
  }
  hasUniqueConstraints() {
    return this.hasConstraints() && !!this.getConstraint('unique');
  }
  getConstraints() {
    return this.getDirective('constraints').getArguments();
  }
  getConstraint(name) {
    return this.getConstraints().find(constraint => constraint.getName() === name);
  }
  getUniqueConstraints() {
    return this.getConstraint('unique').getValue().values.map((constraint) => {
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

  relatedFieldOf(objectType, fieldDefinition) {
    const relatedObjectType = this.getObjectType(fieldDefinition.getTypeName());
    return relatedObjectType && relatedObjectType.getFields().find(field => field.getTypeName() === objectType.getName());
  }
}

export { Document, ObjectType, EnumType, Field, Directive, Argument };
