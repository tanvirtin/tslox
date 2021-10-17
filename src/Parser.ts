import {
  BinaryExpression,
  Expression,
  LiteralExpression,
  UnaryExpression,
} from "./Expression.ts";
import TokenType from "./TokenType.ts";
import Token from "./Token.ts";

/*
  RULES:
  - When precedence incrases we get the item from completed stack and use it as left for our new operator we just encountered.
  - When precedence drops, we pop the last pending expression and pop the last completed expression.
    Then the last pending expression right gets assigned to the last completed expression.
    NOTE: This is only allowed when the current operator precedence is greater than the pending operator precedence.
  - If the precedence is unchanged the behaviour will be the same when precedence drops.
  - When we encounter RPAREN we revert the precedence to what it was before.
*/

export default class Parser {
  private tokens: Token[];
  private currentIndex: number = 0;
  private pendingExpressions: any[] = [];
  private pendingPrecedence: number[] = [];
  private precidenceHistory: number[] = [1, 1];
  private completedExpressions: Expression[] = [];
  private depth = 1;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private previous(): Token {
    return this.tokens[this.currentIndex - 1];
  }

  private current(): Token {
    return this.tokens[this.currentIndex];
  }

  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.current().type == type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        // sets the precedence
        return true;
      }
    }
    return false;
  }

  private advance(): void {
    if (!this.isAtEnd()) {
      ++this.currentIndex;
    }
  }

  private hasCompletedExpressions() {
    return this.completedExpressions.length !== 0;
  }

  private completePendingExpressions(respect_precedence: boolean): Expression | undefined {
    let lastPending
    while (this.hasCompletedExpressions()) {
      lastPending = this.pendingExpressions.at(-1);
      var lastPendingPrecedence = this.pendingPrecedence.at(-1) as number;
      var lastCompleted = this.completedExpressions.pop();
      if (respect_precedence && this.currentPrecedence() > lastPendingPrecedence) {
        return lastCompleted;
      }
      if (lastPending != null) {
        this.pendingExpressions.pop();
        this.pendingPrecedence.pop();
        lastPending.right = lastCompleted
        this.completedExpressions.push(lastPending);
      } else {
        lastPending = lastCompleted;
      }
    }
    return lastPending;
  }

  private setPrecedence(value: number) {
    this.precidenceHistory.push(value ** this.depth);
  }

  private currentPrecedence() {
    return this.precidenceHistory.at(-1) as number;
  }

  private lastPrecedence() {
    return this.precidenceHistory.at(-2) as number;
  }

  private hasPrecedenceIncreased() {
    return this.currentPrecedence() > this.lastPrecedence();
  }

  private literal(value: any) {
    this.completedExpressions.push(new LiteralExpression(value));
  }

  private unary(token: Token) {
    this.pendingExpressions.push(new UnaryExpression(token, undefined));
  }

  private binary(token: Token) {
    if (this.hasPrecedenceIncreased()) {
      var expression = this.completedExpressions.pop();
    } else {
      expression = this.completePendingExpressions(true);
    }
    if (expression != null) {
      this.pendingPrecedence.push(this.currentPrecedence());
      this.pendingExpressions.push(
        new BinaryExpression(expression, token, undefined),
      );
    }
  }

  expression(): Expression | undefined {
    while (!this.isAtEnd()) {
      const token = this.current();

      if (this.match(TokenType.NUMBER)) {
        this.literal((this.previous().literal));
      } else if (this.match(TokenType.STRING)) {
        this.literal((this.previous().literal));
      } else if (this.match(TokenType.FALSE)) {
        this.literal(false);
      } else if (this.match(TokenType.TRUE)) {
        this.literal(true);
      } else if (this.match(TokenType.NIL)) {
        this.literal(false);
      // Unary operator
      } else if (
        !this.hasCompletedExpressions() && this.match(TokenType.BANG, TokenType.MINUS)
      ) {
        this.setPrecedence(7);
        this.unary(token)
      } else if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
        this.setPrecedence(3);
        this.binary(token);
      } else if (
        this.match(
          TokenType.GREATER,
          TokenType.GREATER_EQUAL,
          TokenType.LESS,
          TokenType.LESS_EQUAL,
        )
      ) {
        this.setPrecedence(4);
        this.binary(token);
      } else if (this.match(TokenType.MINUS, TokenType.PLUS)) {
        this.setPrecedence(5);
        this.binary(token);
      } else if (this.match(TokenType.SLASH, TokenType.STAR)) {
        this.setPrecedence(6);
        this.binary(token);
      } else if (this.match(TokenType.LEFT_PAREN)) {
        ++this.depth;
      } else if (this.match(TokenType.RIGHT_PAREN)) {
        --this.depth;
      } else {
        this.advance();
      }
    }

    return this.completePendingExpressions(false);
  }
}
