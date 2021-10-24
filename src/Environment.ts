import Token from "./Token.ts";

export default class Environment {
  private values: Record<string, any> = {};
  private previous?: Environment;

  constructor(previous?: Environment) {
    this.previous = previous;
  }

  define(name: string, value: any) {
    this.values[name] = value;
  }

  get(name: Token): any {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }
    // NOTE**: This is the HEART of lexical scoping.
    //         It is recursive in nature.
    //         If a variable value is not found within this scope, the search begins from this scope
    //         then to the previous scope, all the way to the global scope itself.
    if (this.previous != null) {
      return this.previous.get(name);
    }
    throw new Error(`Undefined variable ${name.lexeme}`);
  }

  assign(name: Token, value: any) {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return;
    }
    if (this.previous != null) {
      this.previous.assign(name, value);
      return;
    }
    throw new Error(`Undefined variable ${name.lexeme}`);
  }
}
