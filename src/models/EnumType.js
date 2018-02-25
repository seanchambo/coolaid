import Directive from './Directive';

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
  getValuesObject() {
    return this.getValues().reduce((acc, value) => ({
      ...acc,
      [value]: { value },
    }), {});
  }
  getValue(name) {
    return this.getValues().find(value => value === name);
  }
}

export default EnumType;
