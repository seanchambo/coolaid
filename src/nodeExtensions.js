import { isScalarType as checkIsScalarType } from './typeIdentifiers';

class Document {
  constructor(document) {
    this.document = document;
  }

  getObjectTypes() {
    return this.document.definitions
      .filter(definition => definition.kind === 'ObjectTypeDefinition')
      .map(objectType => new ObjectType(objectType));
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
      .map(enumType => new EnumType(enumType));
  }
  getEnumType(name) {
    return this.getEnumTypes().find(enumType => enumType.getName() === name);
  }
  enumTypeNames() {
    return this.getEnumTypes().map(enumType => enumType.getName());
  }

  isObjectOrEnumType(name) {
    return getObjectType(name) || getEnumType(name);
  }

  relatedFieldOf(objectType, fieldDefinition) {
    relatedObjectType = this.getObjectType(fieldDefinition.getTypeName());
    return relatedObjectType.getField(objectType.getName());
  }
}

class ObjectType {
  constructor(objectType) {
    this.objectType = objectType;
  }

  getName() {
    return this.objectType.name.value;
  }

  getDirectives() {
    return this.objectType.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().filter(directive => directive.getName() === name);
  }

  getFields() {
    return this.objectType.fields.map(field => new Field(field));
  }
  getField(name) {
    return this.getFields().filter(field => field.getName() === name);
  }
}

class EnumType {
  constructor(enumType) {
    this.enumType = enumType;
  }

  getName() {
    return this.enumType.name.value;
  }

  getDirectives() {
    return this.enumType.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().filter(directive => directive.getName() === name);
  }

  getValues() {
    return this.enumType.values.map(value => value.name.value);
  }
  getValue(name) {
    return this.getValues().find(value => value === name);
  }
}

class Field {
  constructor(field) {
    this.field = field;
  }

  getName() {
    return this.field.name.value;
  }

  getType() {
    return this.isRequired() ? this.field.type.type : this.field.type;
  }
  getTypeName() {
    return this.getType().name.value;
  }

  getDefaultValue() {
    return this.getDirective('defaultValue').getArgument('name').getValue().value
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

  getDirectives() {
    return this.field.directives.map(directive => new Directive(directive));
  }
  getDirective(name) {
    return this.getDirectives().filter(directive => directive.getName() === name);
  }

  hasDefaultValue() {
    return !!this.getDirective('defaultValue');
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
    return this.directive.arguments;
  }
  getArgument(name) {
    return this.getArguments().find(argument => argument.name.value === name);
  }
}

class Argument {
  constructor(argument) {
    this.argument = argument;
  }

  getName() {
    return this.argument.name.value
  }

  getValue() {
    return this.argument.value;
  }
}

export { Document, ObjectType, EnumType, Field, Directive, Argument }
