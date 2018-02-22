import Directive from './Directive';
import { isScalarType as checkIsScalarType } from '../typeIdentifiers';

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

export default Field;
