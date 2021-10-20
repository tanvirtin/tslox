import Token from "./Token.ts";
import Interpreter from "./Interpreter.ts";
import { Expression } from "./Expression.ts";

export interface Statement {
  expression: Expression | undefined;
  execute(interpreter: Interpreter): any;
}

export class ExpressionStatement implements Statement {
  expression: Expression | undefined;

  constructor(expression: Expression | undefined) {
    this.expression = expression;
  }

  execute(interpreter: Interpreter) {
    interpreter.expressionStatement(this);
  }
}

export class PrintStatement implements Statement {
  expression: Expression | undefined;

  constructor(expression: Expression | undefined) {
    this.expression = expression;
  }

  execute(interpreter: Interpreter) {
    interpreter.printStatement(this);
  }
}

export class VariableStatement implements Statement {
  name: Token;
  expression: Expression | undefined;

  constructor(name: Token, expression: Expression | undefined) {
    this.name = name;
    this.expression = expression;
  }

  execute(interpreter: Interpreter) {
    interpreter.variableStatement(this);
  }
}
