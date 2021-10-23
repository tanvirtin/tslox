import Token from './Token.ts';

export default class Environment {
  private values: Record<string, any> = {};

  define(name: string, value: any) {
    this.values[name] = value;
  }

  get(name: Token): any {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme]
    }
    throw new Error(`Undefined variable ${name.lexeme}`);
  }

  assign(name: Token, value: any) {
    this.values[name.lexeme] = value;
  }
}