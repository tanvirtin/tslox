import Token from "./Token.ts";
import Interpreter from "./Interpreter.ts";
import { Expression } from "./Expression.ts";

export interface Statement {
  statements?: Statement[];
  expression?: Expression | undefined;
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
export class BlockStatement implements Statement {
  statements: Statement[];

  constructor(statements: Statement[]) {
    this.statements = statements;
  }

  execute(interpreter: Interpreter) {
    interpreter.blockStatement(this);
  }
}

export class IfStatement implements Statement {
  condition: Expression | undefined;
  thenBranchStatement: Statement | undefined;
  elseBranchStatement: Statement | undefined;

  constructor(
    condition: Expression | undefined,
    thenBranchStatement: Statement | undefined,
    elseBranchStatement: Statement | undefined,
  ) {
    this.condition = condition;
    this.thenBranchStatement = thenBranchStatement;
    this.elseBranchStatement = elseBranchStatement;
  }

  execute(interpreter: Interpreter) {
    interpreter.ifStatement(this);
  }
}

export class WhileStatement implements Statement {
  condition: Expression | undefined;
  // This will be a block statement technicall.y
  body: Statement | undefined;

  constructor(
    condition: Expression | undefined,
    body: Statement | undefined,
  ) {
    this.condition = condition;
    this.body = body;
  }

  execute(interpreter: Interpreter) {
    interpreter.whileStatement(this);
  }
}
