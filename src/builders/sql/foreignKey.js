const generateForeignKey = (table, field, referencedTable, isRequired) => {
  const newField = table
    .integer(field.getName())
    .unsigned();

  if (isRequired) {
    newField.notNullable();
  }

  table
    .foreign(field.getName())
    .references('id')
    .inTable(referencedTable.getName());
};

export default generateForeignKey;
