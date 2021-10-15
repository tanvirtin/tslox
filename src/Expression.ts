import Token from "./Token.ts";

// The class Expression is a node class for the Abstract Syntax Tree.
// As you can see there are different types of Expression for the tree.
// These different types of Expression can refer to each other.
// These references forms a chain of expressions, which will basically be our Abstract Syntax Tree.

export interface Expression {
  toString(): string;
}

// This expression type is atomic in nature. It has no reference to any other Expression.
export class LiteralExpression implements Expression {
  value: any;

  constructor(value: any) {
    this.value = value;
  }

  toString(): string {
    return `(${this.value})`;
  }
}

export class UnaryExpression implements Expression {
  operator: Token;
  right: Expression;

  constructor(operator: Token, right: Expression) {
    this.operator = operator;
    this.right = right;
  }

  toString(): string {
    return `(${this.operator.lexeme} ${this.right.toString()})`;
  }
}

export class BinaryExpression implements Expression {
  left: Expression;
  operator: Token;
  right: Expression;

  constructor(left: Expression, operator: Token, right: Expression) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  toString(): string {
    return `(${this.left.toString()} ${this.operator.lexeme} ${this.right.toString()})`;
  }
}

export class GroupingExpression implements Expression {
  expression: Expression;

  constructor(expression: Expression) {
    this.expression = expression;
  }

  toString(): string {
    return `(${this.expression.toString()})`;
  }
}
