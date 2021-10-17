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
    return `${this.value}`;
  }
}

export class UnaryExpression implements Expression {
  operator: Token;
  right: Expression | undefined;

  constructor(operator: Token, right: Expression | undefined) {
    this.operator = operator;
    this.right = right;
  }

  toString(): string {
    return `(${this.operator.lexeme} ${this.right?.toString() || ""})`;
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

  toString(): string {
    const getStr = (val: any) => val != null ? val.toString() : "<>";
    return `(${getStr(this.left)} ${this.operator.lexeme} ${
      getStr(this.right)
    })`;
  }
}
