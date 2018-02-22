import Directive from './Directive';
import Field from './Field';

class ObjectType {
  constructor(document, objectType) {
    this.document = document;
    this.objectType = objectType;

    this.fields = this.objectType.fields.map(field => new Field(this.document, this, field));
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
    return this.fields;
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
  findRelatedFields(objectType, relatedField, relationName) {
    let potentialFields = this.getRelationFields().filter(field =>
      field.getTypeName() === objectType.getName() && field !== relatedField);

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

export default ObjectType;
