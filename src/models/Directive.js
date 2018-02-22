class Argument {
  constructor(argument) {
    this.argument = argument;
  }

  getName() {
    return this.argument.name.value;
  }

  getValue() {
    return this.argument.value;
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
    return this.directive.arguments.map(argument => new Argument(argument));
  }
  getArgument(name) {
    return this.getArguments().find(argument => argument.getName() === name);
  }
}

export default Directive;

export { Argument };
