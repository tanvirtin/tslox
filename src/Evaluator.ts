import TokenType from "./TokenType.ts";
import {
  BinaryExpression,
  LiteralExpression,
  UnaryExpression,
} from "./Expression.ts";

// Visitor pattern abstracts away the implementation of a given node.

export default class Evaluator {
  literalExpression(expression: LiteralExpression): any {
    return expression.value;
  }

  binaryExpression(expression: BinaryExpression) {
    const left: number = parseFloat(expression.left?.evaluate(this));
    const right: number = parseFloat(expression.right?.evaluate(this));

    switch (expression.operator.type) {
      case TokenType.MINUS:
        return left - right;
      case TokenType.SLASH:
        return left / right;
      case TokenType.STAR:
        return left * right;
      case TokenType.PLUS:
        return left + right;
      case TokenType.GREATER:
        return left > right;
      case TokenType.GREATER_EQUAL:
        return left >= right;
      case TokenType.LESS:
        return left < right;
      case TokenType.LESS_EQUAL:
        return left <= right;
      case TokenType.BANG_EQUAL:
        return left !== right;
      case TokenType.EQUAL_EQUAL:
        return left === right;
    }
  }

  unaryExpression(expression: UnaryExpression) {
    const right: any = expression.right?.evaluate(this);

    switch (expression.operator.type) {
      case TokenType.MINUS:
        return -(parseFloat(right));
      case TokenType.BANG:
        return !(!!right);
    }

    return null;
  }
}
