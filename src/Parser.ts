import {
  ExpressionStatement,
  PrintStatement,
  Statement,
  VariableStatement,
  BlockStatement,
} from "./Statement.ts";
import {
  BinaryExpression,
  Expression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
  AssignmentExpression,
} from "./Expression.ts";
import TokenType from "./TokenType.ts";
import Token from "./Token.ts";

/*
  WARNING: Precedence here is not the same as the precedence in Pratt Parsing, this is a custom iterative solution I came up with to learn more about parser.
  RULES:
  - Precedence directly influences binding power of an expression. An increase and decrease in precedence will change the
    power of the current operator token and will result in the left and right binding power of the expression to change.
  - When precedence incrases we get the item from completed stack and use it as left for our new operator we just encountered.
    Increase in precedence -> New operator has more left binding power. 
  - When precedence drops, we pop the last pending expression and pop the last completed expression.
    Then the last pending expression right gets assigned to the last completed expression.
    NOTE: This is only allowed when the current operator precedence is greater than the pending operator precedence.
    Decrease in precedence -> New opreator has more right binding power. 
  - If the precedence is unchanged the behaviour will be the same when precedence drops.
  - Formula for calculating precedence for an operator is (precedence = operator defined precedence)**depth
  - Anything in inside parenthesis will bump up the depth variable. The depth variable drops when the code
    leaves the right parenthesis. This is how we controll the right and left tug of war via precedence.
*/

export default class Parser {
  private tokens: Token[];
  private cursor: number = 0;
  private precedenceHistory: number[] = [1, 1];
  private pendingPrecedence: number[] = [];
  private pendingExpressions: Expression[] = [];
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

  // Consume token expects a token of a certain type to be the next token.
  // If token is not found, an error is thrown otherwise the token is advanced.
  private consumeToken(type: TokenType, message: string) {
    if (this.checkToken(type)) {
      const token = this.currentToken();
      this.advanceToken();
      return token;
    }
    throw new Error(message);
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
    this.precedenceHistory.push(value ** this.depth);
  }

  private currentPrecedence() {
    const currentPrecedence = this.precedenceHistory.at(-1);
    if (currentPrecedence == null) {
      throw new Error("Failed to retrieve current precedence");
    }
    return currentPrecedence;
  }

  private lastPrecedence() {
    const lastPrecedence = this.precedenceHistory.at(-2);
    if (lastPrecedence == null) {
      throw new Error("Failed to retrieve last precedence");
    }
    return lastPrecedence;
  }

  private hasPrecedenceIncreased() {
    return this.currentPrecedence() > this.lastPrecedence();
  }

  private literalExpression(value: any) {
    this.completedExpressions.push(new LiteralExpression(value));
  }

  private variableExpression(operator: Token) {
    this.completedExpressions.push(new VariableExpression(operator));
  }

  private unaryExpression(operator: Token) {
    this.pendingExpressions.push(new UnaryExpression(operator, undefined));
  }

  private binaryExpression(operator: Token) {
    if (this.hasPrecedenceIncreased()) {
      var expression = this.completedExpressions.pop();
    } else {
      expression = this.completePendingExpressions(true);
    }
    if (expression != null) {
      this.pendingPrecedence.push(this.currentPrecedence());
      this.pendingExpressions.push(
        new BinaryExpression(expression, operator, undefined),
      );
    }
  }

  private assignmentExpression(operator: Token) {
    // If we have pending expression the assignment is invalid, a + b = c, should error out.
    if (this.pendingExpressions.length !== 0) {
      throw new Error('Invalid identier for assignment')
    }
    // Once we encounter "=" we need to pop the last item from the completedExpressions stack.
    // This expression will actually be the Identifier token expression, which is just a LiteralExpression.
    const variableExpression = this.completedExpressions.pop();
    if (!(variableExpression instanceof VariableExpression)) {
      throw new Error('Invalid variable expression');
    }
    if (variableExpression == null) {
      throw new Error('No identifier found for the assignment');
    }
    if (variableExpression.name == null) {
      throw new Error('Identifier is not a token');
    }
    // We push it to the pending expressions stack.
    this.pendingExpressions.push(new AssignmentExpression(variableExpression.name, operator, undefined))
  }

  private isUnaryExpression(): boolean {
    return !this.hasCompletedExpressions();
  }

  private isBinaryExpression(): boolean {
    return this.hasCompletedExpressions();
  }

  expression(): Expression | undefined {
    while (!this.endOfToken()) {
      const token = this.currentToken();

      if (this.matchToken(TokenType.NUMBER)) {
        this.literalExpression((this.previousToken().literal));
      } else if (this.matchToken(TokenType.STRING)) {
        this.literalExpression((this.previousToken().literal));
      } else if (this.matchToken(TokenType.FALSE)) {
        this.literalExpression(false);
      } else if (this.matchToken(TokenType.TRUE)) {
        this.literalExpression(true);
      } else if (this.matchToken(TokenType.NIL)) {
        this.literalExpression(false);
      // Assignments done on a variable is actually an expression. (var a = 3; print a = 99;) should output 99, since print = 99; produces a value.
      } else if (this.matchToken(TokenType.EQUAL)) {
        // NOTE: we just need to look for the equal sign.
        // With the highest possible precedence, whenever precedence drops this operator will
        // be pending and then bind everything to it's right as it's right expression.
        this.setPrecedence(8);
        this.assignmentExpression(token);
      } else if (this.matchToken(TokenType.IDENTIFIER)) {
        this.variableExpression(token);
      } else if (
        this.isUnaryExpression() &&
        this.matchToken(TokenType.BANG, TokenType.MINUS)
      ) {
        this.setPrecedence(7);
        this.unaryExpression(token);
      } else if (
        this.isBinaryExpression() &&
        this.matchToken(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)
      ) {
        this.setPrecedence(3);
        this.binaryExpression(token);
      } else if (
        this.isBinaryExpression() &&
        this.matchToken(
          TokenType.GREATER,
          TokenType.GREATER_EQUAL,
          TokenType.LESS,
          TokenType.LESS_EQUAL,
        )
      ) {
        this.setPrecedence(4);
        this.binaryExpression(token);
      } else if (
        this.isBinaryExpression() &&
        this.matchToken(TokenType.MINUS, TokenType.PLUS)
      ) {
        this.setPrecedence(5);
        this.binaryExpression(token);
      } else if (
        this.isBinaryExpression() &&
        this.matchToken(TokenType.SLASH, TokenType.STAR)
      ) {
        this.setPrecedence(6);
        this.binaryExpression(token);
      } else if (this.matchToken(TokenType.LEFT_PAREN)) {
        ++this.depth;
      } else if (this.matchToken(TokenType.RIGHT_PAREN)) {
        --this.depth;
      } else {
        // If we can't find a token we know we end the loop!
        // In the future this is where we will dictate statement end indicators.
        break;
      }
    }

    return this.completePendingExpressions(false);
  }

  printStatement() {
    // NOTE: The search for tokens if none of the if statements are caught.
    //       Since the ";" token is not in the if statement, the look for
    //       tokens will end immediately returning us the expression made so far.
    const expression = this.expression();
    if (expression == null) {
      throw new Error("No expression provided for the print statement");
    }
    // When expression is a statement it means having a ";" is a must in our language.
    this.consumeToken(TokenType.SEMICOLON, 'Expected ";" after expression');
    return new PrintStatement(expression);
  }

  expressionStatement() {
    const expression = this.expression();
    if (expression == null) {
      throw new Error("No expression provided for the expression statement");
    }
    // When expression is a statement it means having a ";" is a must in our language.
    this.consumeToken(TokenType.SEMICOLON, 'Expected ";" after expression');
    return new ExpressionStatement(expression);
  }

  variableStatement() {
    const name: Token = this.consumeToken(
      TokenType.IDENTIFIER,
      "Expected variable name",
    );
    let expression;
    // We check if the next token is an equal.
    // NOTE**: We are not consuming the equal token, and this is not an assertion
    //         because users can define variables with a nil value such as var a;
    if (this.matchToken(TokenType.EQUAL)) {
      expression = this.expression();
    }
    this.consumeToken(TokenType.SEMICOLON, "Expected variable declaration");
    return new VariableStatement(name, expression);
  }

  // A block is a mini program with it's own series of statements.
  blockStatement() {
    const statements: Statement[] = [];
    // Until we haven't encountered a right brace or we have not reached the end of all tokens,
    // we will loop through the tokens and add all variable statements inside the list of statements.
    // Block for now will contain a series of statements.
    while (!this.checkToken(TokenType.RIGHT_BRACE) && !this.endOfToken()) {
      statements.push(this.declaration());
    }
    // We will always expect a RIGHT_BRACE token to end a block.
    // If we reached the end of token before hitting a RIGHT_BRACE, program should error out.
    this.consumeToken(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return new BlockStatement(statements);
  }

  // This will get called after we failed to find a declration statement.
  statement() {
    if (this.matchToken(TokenType.PRINT)) {
      return this.printStatement();
    }
    if (this.matchToken(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }
    return this.expressionStatement();
  }

  // We look for declarations first, if we can't find a declaration it's probably some other type of statement.
  declaration() {
    if (this.matchToken(TokenType.VAR)) {
      return this.variableStatement();
    }
    return this.statement();
  }

  // A program is a series of statements. Statements are composed of expressions.
  parse(): Statement[] {
    const statements: Statement[] = [];
    // The while loop kicks start of the scavenging of tokens.
    // NOTE**: this.cursor only progresses within the this.expression call and sub calls.
    while (!this.endOfToken()) {
      statements.push(this.declaration());
    }
    return statements;
  }
}
