import { capitalizeFirstLetter } from '../utils';

class Relation {
  constructor(objectTypeA, fieldA, objectTypeB, fieldB, name) {
    this.objectTypeA = objectTypeA;
    this.objectTypeB = objectTypeB;
    this.fieldA = fieldA;
    this.fieldB = fieldB;
    this.name = name;
  }

  getOpposite(field) {
    return field === this.fieldA ?
      { field: this.fieldB, objectType: this.objectTypeB } :
      { field: this.fieldA, objectType: this.objectTypeA };
  }

  getType(field) {
    if (this.isOneToOne()) { return 'OneToOne'; }
    if (this.isOneToMany() && field === this.getForeignKey()) { return 'ManyToOne'; }
    if (this.isOneToMany() && field !== this.getForeignKey()) { return 'OneToMany'; }
    return 'ManyToMany';
  }

  isSelfReferencing() {
    return this.objectTypeA === this.objectTypeB;
  }

  isOneToOne() {
    return !this.fieldA.isList() && !this.fieldB.isList();
  }

  isOneToMany() {
    return (!this.fieldA.isList() && this.fieldB.isList()) ||
      (this.fieldA.isList() && !this.fieldB.isList());
  }

  getForeignKey() {
    return this.fieldA.isList() ? this.fieldB : this.fieldA;
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

export default Relation;
