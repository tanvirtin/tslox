import {
  BinaryExpression,
  Expression,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
} from "./Expression.ts";
import TokenType from "./TokenType.ts";
import Token from "./Token.ts";

// Parser is using the prat parsing technique.
// The way this parser functions is by expanding the stack recursively by until
// the expressions (if any) with the highest precidence will always get resolved
// first since, the parser will keep adding recursive functions to the call stack
// and get to the bottom of the precedence. Little diagram for what I mean by bottom.

// For an expression that looks like this: 6 / 3 - 1, The path of resolution should look like this:
// Step: 1
//           -
//         /
//       6  3
//
// Step: 2
//           -
//         2
//
// Step: 3
//           -
//         2     1
//
// From the diagram and the three steps you can see that the stack needs to be expanded till we hit
// the bottom of the expression and then bubble back up. The bottom of the expression will be the
// operations with the highest precidence. As you can see "/" has a higher precidence over "-".

export default class Parser {
  private tokens: Token[];
  private currentIndex: number = 0;

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
        return true;
      }
    }
    return false;
  }

  private advance(): Token {
    const token = this.current();
    if (!this.isAtEnd()) {
      ++this.currentIndex;
    }
    return token;
  }

  private consume(type: TokenType, message: string): void {
    if (this.check(type)) {
      this.advance();
      return;
    }

    throw new Error(message);
  }

  // Highest precedence-- Precedence value: 6.
  private primary(): Expression {
    if (this.match(TokenType.FALSE)) return new LiteralExpression(false);
    if (this.match(TokenType.TRUE)) return new LiteralExpression(false);
    if (this.match(TokenType.NIL)) return new LiteralExpression(false);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpression((this.previous().literal));
    }

    // NOTE: match consumes the token if it matches.
    if (this.match(TokenType.LEFT_PAREN)) {
      // We make the lowest precedence call and retrieve the entire expression within the left and right paren brackets.
      const expression = this.expression();
      // If a left parenthesis was matched, then the parser must find a corresponding right parenthesis or its an error.
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpression(expression);
    }

    throw new Error("Expected expression.");
  }

  // Precedence value: 5
  private unary(): Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpression(operator, right);
    }

    return this.primary();
  }

  // Precedence value: 4
  private factor(): Expression {
    // Peeling the precedence layer and calling a method with higher precedence to see if we can get any expression from it.
    let expression = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  // Precedence value: 3
  private term(): Expression {
    // Peeling the precedence layer and calling a method with higher precedence to see if we can get any expression from it.
    let expression = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  // Precedence value: 2
  private comparison(): Expression {
    // Peeling the precedence layer and calling a method with higher precedence to see if we can get any expression from it.
    let expression = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  // Precedence value: 1
  private equality(): Expression {
    // Peeling the precedence layer and calling a method with higher precedence to see if we can get any expression from it.
    let expression = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expression = new BinaryExpression(expression, operator, right);
    }

    return expression;
  }

  expression(): Expression {
    // Lowest precedence call.
    return this.equality();
  }
}
