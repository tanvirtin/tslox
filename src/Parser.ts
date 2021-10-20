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
  - Formula for calculating precedence for an operator is (precedence = operator defined precedence)**depth
*/

export default class Parser {
  private tokens: Token[];
  private cursor: number = 0;
  private pendingExpressions: (BinaryExpression | UnaryExpression)[] = [];
  private pendingPrecedence: number[] = [];
  private precidenceHistory: number[] = [1, 1];
  private completedExpressions: Expression[] = [];
  private depth = 1;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private previousToken(): Token {
    return this.tokens[this.cursor - 1];
  }

  private currentToken(): Token {
    return this.tokens[this.cursor];
  }

  // End of Token
  private endOfToken(): boolean {
    return this.currentToken().type === TokenType.EOF;
  }

  private checkToken(type: TokenType): boolean {
    if (this.endOfToken()) return false;
    return this.currentToken().type == type;
  }

  private matchToken(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.checkToken(type)) {
        this.advanceToken();
        return true;
      }
    }
    return false;
  }

  private advanceToken(): void {
    if (!this.endOfToken()) {
      ++this.cursor;
    }
  }

  private hasCompletedExpressions() {
    return this.completedExpressions.length !== 0;
  }

  private completePendingExpressions(
    respect_precedence: boolean,
  ): Expression | undefined {
    let lastPending;
    while (this.hasCompletedExpressions()) {
      lastPending = this.pendingExpressions.at(-1);
      var lastPendingPrecedence = this.pendingPrecedence.at(-1);
      var lastCompleted = this.completedExpressions.pop();
      if (
        respect_precedence && lastPendingPrecedence &&
        this.currentPrecedence() > lastPendingPrecedence
      ) {
        return lastCompleted;
      }
      if (lastPending != null) {
        this.pendingExpressions.pop();
        this.pendingPrecedence.pop();
        lastPending.right = lastCompleted;
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
    const currentPrecedence = this.precidenceHistory.at(-1);
    if (currentPrecedence == null) {
      throw new Error("Failed to retrieve current precedence");
    }
    return currentPrecedence;
  }

  private lastPrecedence() {
    const lastPrecedence = this.precidenceHistory.at(-2);
    if (lastPrecedence == null) {
      throw new Error("Failed to retrieve last precedence");
    }
    return lastPrecedence;
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

  private isUnary(): boolean {
    return !this.hasCompletedExpressions();
  }

  private isBinary(): boolean {
    return this.hasCompletedExpressions();
  }

  expression(): Expression | undefined {
    while (!this.endOfToken()) {
      const token = this.currentToken();

      if (this.matchToken(TokenType.NUMBER)) {
        this.literal((this.previousToken().literal));
      } else if (this.matchToken(TokenType.STRING)) {
        this.literal((this.previousToken().literal));
      } else if (this.matchToken(TokenType.FALSE)) {
        this.literal(false);
      } else if (this.matchToken(TokenType.TRUE)) {
        this.literal(true);
      } else if (this.matchToken(TokenType.NIL)) {
        this.literal(false);
        // Unary expressions: All expression to the left must be bounded before we handle unary expressions.
      } else if (
        this.isUnary() && this.matchToken(TokenType.BANG, TokenType.MINUS)
      ) {
        this.setPrecedence(7);
        this.unary(token);
      } else if (
        this.isBinary() &&
        this.matchToken(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)
      ) {
        this.setPrecedence(3);
        this.binary(token);
      } else if (
        this.isBinary() &&
        this.matchToken(
          TokenType.GREATER,
          TokenType.GREATER_EQUAL,
          TokenType.LESS,
          TokenType.LESS_EQUAL,
        )
      ) {
        this.setPrecedence(4);
        this.binary(token);
      } else if (
        this.isBinary() && this.matchToken(TokenType.MINUS, TokenType.PLUS)
      ) {
        this.setPrecedence(5);
        this.binary(token);
      } else if (
        this.isBinary() && this.matchToken(TokenType.SLASH, TokenType.STAR)
      ) {
        this.setPrecedence(6);
        this.binary(token);
      } else if (this.matchToken(TokenType.LEFT_PAREN)) {
        ++this.depth;
      } else if (this.matchToken(TokenType.RIGHT_PAREN)) {
        --this.depth;
      } else {
        this.advanceToken();
      }
    }

    return this.completePendingExpressions(false);
  }
}
