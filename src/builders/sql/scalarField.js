const generateScalarField = (table, field) => {
  let newField;
  switch (field.getTypeName()) {
    case 'ID':
      newField = table.increments(field.getName());
      break;
    case 'String':
      newField = table.string(field.getName(), field.getMaxLength());
      break;
    case 'Int':
      newField = table.integer(field.getName());
      break;
    case 'Float':
      newField = table.float(field.getName());
      break;
    case 'DateTime':
      newField = table.dateTime(field.getName());
      break;
    case 'Boolean':
      newField = table.boolean(field.getName());
      break;
    default:
      throw new Error('Field is not scalar');
  }

  if (field.isRequired()) {
    newField = newField.notNullable();
  }

  if (field.hasDefaultValue()) {
    newField = newField.defaultTo(field.getDefaultValue());
  }

  return newField;
};

export default generateScalarField;
