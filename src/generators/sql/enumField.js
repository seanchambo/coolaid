const generateEnumField = (table, field) => {
  let newField = table.enu(field.getName(), field.getEnum().getValues());

  if (field.isRequired()) {
    newField = newField.notNullable();
  }

  if (field.hasDefaultValue()) {
    newField = newField.defaultTo(field.getDefaultValue());
  }

  return newField;
};

export default generateEnumField;
