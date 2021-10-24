import Interpreter from "./Interpreter.ts";
import Token from "./Token.ts";

// Recursive in nature. This will call the function call stack recursively until toString method resolves.
// NOTE: Printing to the screen functionality can also be redesigned as a visitor pattern, but for simplicity I am
//       limiting that now. This can also be a reflection on how the visitor pattern can be useful when I eventually
//       revisit this project.
const toString = (expression: Expression | undefined) =>
  expression != null ? expression.toString() : "<>";

export interface Expression {
  name?: Token | Expression | undefined;
  left?: Token | Expression | undefined;
  right?: Token | Expression | undefined;
  toString(): string;
  evaluate(interpreter: Interpreter): any;
}

// This expression type is atomic in nature. It has no reference to any other Expression.
export class LiteralExpression implements Expression {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.literalExpression(this);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class VariableExpression implements Expression {
  name: Token;

  constructor(name: Token) {
    this.name = name;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.variableExpression(this);
  }

  toString(): string {
    return this.name.toString();
  }
}

export class UnaryExpression implements Expression {
  operator: Token;
  right: Expression | undefined;

  constructor(operator: Token, right: Expression | undefined) {
    this.operator = operator;
    this.right = right;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.unaryExpression(this);
  }

  toString(): string {
    return `(${this.operator.lexeme} ${toString(this.right)})`;
  }
}

export class BinaryExpression implements Expression {
  left: Expression | undefined;
  operator: Token;
  right: Expression | undefined;

  constructor(
    left: Expression | undefined,
    operator: Token,
    right: Expression | undefined,
  ) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.binaryExpression(this);
  }

  toString(): string {
    return `(${toString(this.left)} ${this.operator.lexeme} ${
      toString(this.right)
    })`;
  }
}

export class AssignmentExpression implements Expression {
  left: Token;
  operator: Token;
  right: Expression | undefined;

  constructor(left: Token, operator: Token, value: Expression | undefined) {
    this.left = left;
    this.operator = operator;
    this.right = value;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.assignmentExpression(this);
  }

  toString(): string {
    return `${this.left.lexeme} ${this.operator.lexeme} ${
      toString(this.right)
    }`;
  }
}

export class LogicalExpression implements Expression {
  left: Token;
  operator: Token;
  right: Expression | undefined;

  constructor(left: Token, operator: Token, value: Expression | undefined) {
    this.left = left;
    this.operator = operator;
    this.right = value;
  }

  evaluate(interpreter: Interpreter): any {
    return interpreter.assignmentExpression(this);
  }

  toString(): string {
    return `${this.left.lexeme} ${this.operator.lexeme} ${
      toString(this.right)
    }`;
  }
}
