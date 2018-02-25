import * as graphql from 'graphql';
import camelcase from 'lodash.camelcase';

import knex from '../../connectors/database';
import { getGraphqlType } from '../../typeIdentifiers';
import { capitalizeFirstLetter } from '../../utils';

function buildWhereQuery(whereArgs) {
  return function() {
    Object.keys(whereArgs).forEach((where) => {
      const value = whereArgs[where];

      if (where.match(/_not$/)) {
        this.whereNot(buildMultiWhereQuery(value));
        return;
      }

      if (where.match(/_and$/)) {
        this.where(buildMultiWhereQuery(value));
        return;
      }

      if (where.match(/_or$/)) {
        this.whereOr(buildMultiWhereQuery(value));
        return;
      }

      if (where.match(/_lt$/)) {
        const { index } = where.match(/_lt$/);
        const name = where.slice(0, index);
        this.where(name, '<', value);
        return;
      }

      if (where.match(/_lte$/)) {
        const { index } = where.match(/_lte$/);
        const name = where.slice(0, index);
        this.where(name, '<=', value);
        return;
      }

      if (where.match(/_gt$/)) {
        const { index } = where.match(/_gt$/);
        const name = where.slice(0, index);
        this.where(name, '>', value);
        return;
      }

      if (where.match(/_gte$/)) {
        const { index } = where.match(/_gte$/);
        const name = where.slice(0, index);
        this.where(name, '>=', value);
        return;
      }

      if (where.match(/_in$/)) {
        const { index } = where.match(/_in$/);
        const name = where.slice(0, index);
        this.whereIn(name, value);
        return;
      }

      if (where.match(/_starts_with$/)) {
        const { index } = where.match(/_starts_with$/);
        const name = where.slice(0, index);
        this.where(name, 'like', `${value}%`);
        return;
      }

      if (where.match(/_ends_with$/)) {
        const { index } = where.match(/_ends_with$/);
        const name = where.slice(0, index);
        this.where(name, 'like', `%${value}`);
        return;
      }

      if (where.match(/_contains$/)) {
        const { index } = where.match(/_contains$/);
        const name = where.slice(0, index);
        this.where(name, 'like', `%${value}%`);
        return;
      }

      this.where(where, value);
    });
  };
}

function buildMultiWhereQuery(multiWhereArgs, and = true) {
  return function() {
    multiWhereArgs.forEach((whereArgs) => {
      if (and) {
        this.where(buildWhereQuery(whereArgs));
      } else {
        this.whereOr(buildWhereQuery(whereArgs));
      }
    });
  }
}

const buildQuery = (objectType, args) => {
  const query = knex(objectType.getName());

  if (args.where) {
    query.where(buildWhereQuery(args.where));
  }

  return query;
};

class GraphQLGenerator {
  constructor(document) {
    this.document = document;
    this.whereInputs = {};
    this.whereUniqueInputs = {};
    this.orderByInputs = {};
    this.objectTypes = {};
    this.objectTypeFields = {};
  }

  generate() {
    this.generateWhereInputs();
    this.generateWhereUniqueInputs();
    this.generateOrderByInputs();
    this.generateObjectTypes();
    this.generateObjectTypesFields();

    const queryType = this.generateQueryType();

    return new graphql.GraphQLSchema({ query: queryType });
  }

  generateQueryType() {
    return new graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => this.document.getObjectTypes().reduce((acc, objectType) => {
        const singular = {
          type: this.objectTypes[objectType.getName()],
          args: { where: { type: this.whereUniqueInputs[objectType.getName()] } },
          resolve: (_, args) => buildQuery(objectType, args).first(),
        };

        const plural = {
          type: new graphql.GraphQLList(this.objectTypes[objectType.getName()]),
          args: {
            where: { type: this.whereInputs[objectType.getName()] },
            orderBy: { type: new graphql.GraphQLList(this.orderByInputs[objectType.getName()]) },
          },
          resolve: (_, args) => buildQuery(objectType, args),
        };

        return {
          ...acc,
          [objectType.getName()]: singular,
          [objectType.getPlural()]: plural,
        };
      }, {}),
    });
  }

  generateWhereInputs() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectTypeWhereInput(objectType);
    });
  }

  generateObjectTypeWhereInput(objectType) {
    const fields = objectType.getScalarTypeFields().reduce((acc, field) => {
      const fieldFilters = {};
      const type = getGraphqlType(field.getTypeName());

      ['lt', 'lte', 'gt', 'gte'].forEach((filterType) => {
        fieldFilters[`${field.getName()}_${filterType}`] = { type };
      });

      ['in'].forEach((filterType) => {
        fieldFilters[`${field.getName()}_${filterType}`] = { type: new graphql.GraphQLList(type) };
      });

      if (field.getTypeName() === 'String') {
        ['starts_with', 'ends_with', 'contains'].forEach((filterType) => {
          fieldFilters[`${field.getName()}_${filterType}`] = { type };
        });
      }

      fieldFilters[field.getName()] = { type };

      return { ...acc, ...fieldFilters };
    }, {});


    const whereInputType = new graphql.GraphQLInputObjectType({
      name: `${objectType.getName()}WhereInput`,
      fields: () => fields,
    });

    ['not', 'or', 'and'].forEach((filterType) => {
      fields[`_${filterType}`] = { type: new graphql.GraphQLList(whereInputType) };
    });

    this.whereInputs[objectType.getName()] = whereInputType;
  }

  generateWhereUniqueInputs() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectTypeWhereUniqueInput(objectType);
    });
  }

  generateObjectTypeWhereUniqueInput(objectType) {
    let fields = {};

    if (objectType.hasUniqueConstraints()) {
      const uniqueFields = objectType.getUniqueConstraints().reduce((acc, constraint) => {
        const fieldFilters = {};
        const constraintFields = constraint.fields.map(cf => objectType.getField(cf));

        if (constraintFields.length === 1) {
          const cf = constraintFields[0];
          fieldFilters[cf.getName()] = { type: getGraphqlType(cf.getTypeName()) };
        } else {
          const filterFieldName = constraintFields.map(field => field.getName()).join('_and_');
          const inputName = capitalizeFirstLetter(camelcase(`${objectType.getName()}_${filterFieldName}_WhereUniqueInput`));
          const inputFields = constraintFields.reduce((acc1, field) => ({
            ...acc1,
            [field.getName()]: {
              type: new graphql.GraphQLNonNull(getGraphqlType(field.getTypeName())),
            },
          }), {});
          const inputType = new graphql.GraphQLInputObjectType({
            name: inputName,
            fields: () => inputFields,
          });
          fieldFilters[filterFieldName] = { type: inputType };
        }

        return { ...acc, ...fieldFilters };
      }, {});

      fields = { ...fields, ...uniqueFields };
    }

    const primaryKeyFields = objectType.getPrimaryKeyFields().reduce((acc, primaryKey) => ({
      ...acc,
      [primaryKey.getName()]: { type: getGraphqlType(primaryKey.getTypeName()) },
    }), {});

    fields = { ...fields, ...primaryKeyFields };

    const whereUniqueInputType = new graphql.GraphQLInputObjectType({
      name: `${objectType.getName()}WhereUniqueInput`,
      fields: () => fields,
    });

    ['or'].forEach((filterType) => {
      fields[`_${filterType}`] = { type: new graphql.GraphQLList(whereUniqueInputType) };
    });

    this.whereUniqueInputs[objectType.getName()] = whereUniqueInputType;
  }

  generateOrderByInputs() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectTypeOrderByInput(objectType);
    });
  }

  generateObjectTypeOrderByInput(objectType) {
    let index = 0;
    const values = objectType.getScalarTypeFields().reduce((acc, field) => {
      const fieldOrders = ['DESC', 'ASC'].reduce((acc1, orderType) => {
        index += 1;
        return { ...acc1, [`${field.getName()}_${orderType}`]: { value: index - 1 } };
      }, {});
      return { ...acc, ...fieldOrders };
    }, {});

    this.orderByInputs[objectType.getName()] = new graphql.GraphQLEnumType({
      name: `${objectType.getName()}OrderByInput`,
      values,
    });
  }

  generateObjectTypes() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectType(objectType);
    });
  }

  generateObjectType(objectType) {
    this.objectTypes[objectType.getName()] = new graphql.GraphQLObjectType({
      name: objectType.getName(),
      fields: () => this.objectTypeFields[objectType.getName()],
    });
  }

  generateObjectTypesFields() {
    this.document.getObjectTypes().forEach((objectType) => {
      this.generateObjectTypeFields(objectType);
    });
  }

  generateObjectTypeFields(objectType) {
    const scalarFields = objectType.getScalarTypeFields().reduce((acc, field) => ({
      ...acc,
      [field.getName()]: { type: getGraphqlType(field.getTypeName()) },
    }), {});

    const enumFields = objectType.getEnumFields().reduce((acc, field) => ({
      ...acc,
      [field.getName()]: { type: graphql.GraphQLString },
    }), {});

    const relationshipFields = objectType.getRelationFields().reduce((acc, field) => {
      let type;
      let resolve;
      const relationship = objectType.getRelationships().find(r => r.hasField(field));
      const opposite = relationship.getOpposite(field);

      switch (relationship.getType(field)) {
        case 'OneToOne':
        case 'ManyToOne':
          type = this.objectTypes[opposite.objectType.getName()];
          resolve = object =>
            knex(opposite.objectType.getName())
              .whereIn('id', [object[field.getName()]])
              .first();
          break;
        case 'OneToMany':
          type = new graphql.GraphQLList(this.objectTypes[opposite.objectType.getName()]);
          resolve = object =>
            knex(opposite.objectType.getName())
              .whereIn(opposite.field.getName(), [object.id]);
          break;
        case 'ManyToMany':
          type = new graphql.GraphQLList(this.objectTypes[opposite.objectType.getName()]);
          resolve = async (object) => {
            const firstHalf = await knex(relationship.getName())
              .whereIn(opposite.field.getName(), [object.id]);
            return knex(opposite.objectType.getName())
              .whereIn('id', firstHalf.map(row => row[field.getName()]));
          };
          break;
        default:
          throw new Error("Isn't a support relationship type??");
      }

      return { ...acc, [field.getName()]: { type, resolve } };
    }, {});

    const fields = { ...scalarFields, ...enumFields, ...relationshipFields };
    this.objectTypeFields[objectType.getName()] = fields;
  }
}

export default GraphQLGenerator;
