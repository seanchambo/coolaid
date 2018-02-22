const generateUniqueConstraint = (table, constraint) => {
  table.unique(constraint.fields, constraint.name);
};

const generateIndex = (table, index) => {
  table.index(index.fields, index.name, index.type);
};

export { generateUniqueConstraint, generateIndex };
