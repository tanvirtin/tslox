import {
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  PrintStatement,
  Statement,
  VariableStatement,
} from "./Statement.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  Expression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
} from "./Expression.ts";
import TokenType from "./TokenType.ts";
import Token from "./Token.ts";

/*
  WARNING: This is not any parsing algorithm we are aware of this is a custom algorithm I implemented.
           Use with caution requires verbose testing beforehand.
  RULES:
  - We keep a stack of binding powers indicating the history of bindings powers so far.
  - Initially this stack starts with [1, 1].
  - Encountering a particular operator might add a binding power to this stack.
  - We will keep three primary stacks for expression computation:
      - pendingExpressions (Contains incomplete expreessions waiting to be completed)
      - pendingExpressionBindingPowers (Contains the corresponding binding powers for the pending expressions)
      - completedExpressions (Contains all the completed expressions yet to be dealt with)

  - When binding power incrases we get the last item from completed stack and use it as left for our new operator we just encountered.
    --------------------------------------------------------------------------------------------------------------
    Increase in binding power -> New operator gets expression from completed stack and assigns it to the left arm.
    --------------------------------------------------------------------------------------------------------------
    E.g 2 + 3 * 4, Binding power of * is greater than binding power of +, this results in * pulling 3 away from +.
    And eventually the expression will look like 2 <- + -> (3 <- * -> 4).

  - When binding power drops, we pop the last pending expression and pop the last completed expression.
    Then the last pending expression's right gets assigned to the last completed expression.
    A pending expression will always have a right expression that needs to be completed.
    After we complete the binding the expression is now completed, it then gets pushed to the completed stack,
    and this logic repeats until there are no more expressions in the completed stack. Unless we have finished computing
    all the tokens, this operation should ONLY repeat if the current binding power of the new operator is greater
    then whatever pending expression we are dealing with.
    If we encountered a new operator then the left arm of this operator becomes the expression we just combined and completed.
    -------------------------------------------------------------------------------------------------------------------------------------
    Decrease in binding power -> We complete all pending expressions by binding the it's right arm to whatever is in the completed stack.
                                 New operator's left expression becomes the new completed expression.
    -------------------------------------------------------------------------------------------------------------------------------------
    NOTE: Unary and assignment expressions which are non binary expressions heavily rely on this mechanism since they will always have the highest binding power.
          Anytime we encounter a Unary or assignment expressions we always push it to the pending expressions stack.
          We know anytime any other expression with a lower precedence comes in will force the unary and assignment expressions to complete.

  - If the binding power is unchanged the behaviour will be the same when binding power drops.
  - Formula for calculating binding power for an operator is (binding power = user defined value * 10) ** depth
  - Anything in inside parenthesis will bump up the depth variable. The depth variable drops when the code
    leaves the right parenthesis. This is how we controll the right and left tug of war via binding power.
*/

export default class Parser {
  private tokens: Token[];
  private cursor: number = 0;
  private bindingPowerHistory: number[] = [1, 1];
  private pendingExpressionBindingPowers: number[] = [];
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
    respectBindingPower: boolean,
  ): Expression | undefined {
    let lastPendingExpression;
    while (this.hasCompletedExpressions()) {
      lastPendingExpression = this.pendingExpressions.at(-1);
      var lastPendingBindingPower = this.pendingExpressionBindingPowers.at(-1);
      var lastCompletedExpression = this.completedExpressions.pop();
      if (
        respectBindingPower && lastPendingBindingPower &&
        this.currentBindingPower() > lastPendingBindingPower
      ) {
        return lastCompletedExpression;
      }
      if (lastPendingExpression != null) {
        this.pendingExpressions.pop();
        this.pendingExpressionBindingPowers.pop();
        lastPendingExpression.right = lastCompletedExpression;
        this.completedExpressions.push(lastPendingExpression);
      } else {
        lastPendingExpression = lastCompletedExpression;
      }
    }
    return lastPendingExpression;
  }

  private setBindingPower(value: number) {
    this.bindingPowerHistory.push((value * 10) ** this.depth);
  }

  private currentBindingPower() {
    const currentBindingPower = this.bindingPowerHistory.at(-1);
    if (currentBindingPower == null) {
      throw new Error("Failed to retrieve current bindingPower");
    }
    return currentBindingPower;
  }

  private lastBindingPower() {
    const lastBindingPower = this.bindingPowerHistory.at(-2);
    if (lastBindingPower == null) {
      throw new Error("Failed to retrieve last bindingPower");
    }
    return lastBindingPower;
  }

  private hasBindingPowerIncreased() {
    return this.currentBindingPower() > this.lastBindingPower();
  }

  private isUnaryExpression(): boolean {
    return !this.hasCompletedExpressions();
  }

  private isBinaryExpression(): boolean {
    return this.hasCompletedExpressions();
  }

  private literalExpression(value: any) {
    this.completedExpressions.push(new LiteralExpression(value));
  }

  private variableExpression(operator: Token) {
    this.completedExpressions.push(new VariableExpression(operator));
  }

  private assignmentExpression(operator: Token) {
    const bindingPowers: Record<string, number> = {
      [TokenType.EQUAL]: 7,
    };
    this.setBindingPower(bindingPowers[operator.type]);
    // If we have pending expression the assignment is invalid, a + b = c, should error out.
    if (this.pendingExpressions.length !== 0) {
      throw new Error("Invalid identier for assignment");
    }
    // Once we encounter "=" we need to pop the last item from the completedExpressions stack.
    // This expression will actually be the Identifier token expression, which is just a LiteralExpression.
    const variableExpression = this.completedExpressions.pop();
    if (!(variableExpression instanceof VariableExpression)) {
      throw new Error("Invalid variable expression");
    }
    if (variableExpression == null) {
      throw new Error("No identifier found for the assignment");
    }
    if (variableExpression.name == null) {
      throw new Error("Identifier is not a token");
    }
    // We push it to the pending expressions stack.
    this.pendingExpressions.push(
      new AssignmentExpression(variableExpression.name, operator, undefined),
    );
  }

  private unaryExpression(operator: Token) {
    const bindingPowers: Record<string, number> = {
      [TokenType.BANG]: 7,
      [TokenType.MINUS]: 7,
    };
    this.setBindingPower(bindingPowers[operator.type]);
    this.pendingExpressions.push(new UnaryExpression(operator, undefined));
  }

  private binaryExpression(operator: Token) {
    const bindingPowers: Record<string, number> = {
      [TokenType.OR]: 2,
      [TokenType.AND]: 2,
      [TokenType.BANG_EQUAL]: 3,
      [TokenType.EQUAL_EQUAL]: 3,
      [TokenType.GREATER]: 4,
      [TokenType.GREATER_EQUAL]: 4,
      [TokenType.LESS]: 4,
      [TokenType.LESS_EQUAL]: 4,
      [TokenType.MINUS]: 5,
      [TokenType.PLUS]: 5,
      [TokenType.SLASH]: 6,
      [TokenType.STAR]: 6,
    };
    this.setBindingPower(bindingPowers[operator.type]);
    if (this.hasBindingPowerIncreased()) {
      var expression = this.completedExpressions.pop();
    } else {
      expression = this.completePendingExpressions(true);
    }
    if (expression != null) {
      this.pendingExpressionBindingPowers.push(this.currentBindingPower());
      this.pendingExpressions.push(
        new BinaryExpression(expression, operator, undefined),
      );
    }
  }

  expression(): Expression | undefined {
    while (!this.endOfToken()) {
      // If we encounter a semicolon we break the loop. This indicates that we are done with the expression.
      if (this.checkToken(TokenType.SEMICOLON)) {
        break;
      }

      const token = this.currentToken();

      // We are scavenging for tokens that help us identify parts of an expression.
      // If we encounter any token that is out of ordinary we break the loop.
      switch (true) {
        case this.matchToken(TokenType.NUMBER):
          this.literalExpression((this.previousToken().literal));
          break;
        case this.matchToken(TokenType.STRING):
          this.literalExpression((this.previousToken().literal));
          break;
        case this.matchToken(TokenType.FALSE):
          this.literalExpression(false);
          break;
        case this.matchToken(TokenType.TRUE):
          this.literalExpression(true);
          break;
        case this.matchToken(TokenType.NIL):
          this.literalExpression(false);
          break;
        // Assignments done on a variable is actually an expression. (var a = 3; print a = 99;) should output 99, since print = 99; produces a value.
        case this.matchToken(TokenType.EQUAL):
          // NOTE: we just need to look for the equal sign.
          this.assignmentExpression(token);
          break;
        case this.matchToken(TokenType.IDENTIFIER):
          this.variableExpression(token);
          break;
        case (this.isUnaryExpression() &&
          this.matchToken(TokenType.BANG, TokenType.MINUS)):
          this.unaryExpression(token);
          break;
        case (
          this.isBinaryExpression() &&
          this.matchToken(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)
        ):
          this.binaryExpression(token);
          break;
        case (
          this.isBinaryExpression() &&
          this.matchToken(
            TokenType.GREATER,
            TokenType.GREATER_EQUAL,
            TokenType.LESS,
            TokenType.LESS_EQUAL,
          )
        ):
          this.binaryExpression(token);
          break;
        case (
          this.isBinaryExpression() &&
          this.matchToken(TokenType.MINUS, TokenType.PLUS)
        ):
          this.binaryExpression(token);
          break;
        case (
          this.isBinaryExpression() &&
          this.matchToken(TokenType.SLASH, TokenType.STAR)
        ):
          this.binaryExpression(token);
          break;
        case this.matchToken(TokenType.OR):
          this.binaryExpression(token);
          break;
        case this.matchToken(TokenType.AND):
          this.binaryExpression(token);
          break;
        case this.matchToken(TokenType.LEFT_PAREN):
          ++this.depth;
          break;
        case this.matchToken(TokenType.RIGHT_PAREN):
          --this.depth;
          break;
        default:
          // If we encounter any token while processing the expression that doesn't belong to an expression we end the loop.
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

  ifStatement(): Statement {
    // NOTE** - Parenthesis are optional for declaring conditions in an if statement.
    const condition: Expression | undefined = this.expression();
    const thenBranchStatement: Statement = this.statement();
    let elseBranchStatement;
    if (this.matchToken(TokenType.ELSE)) {
      elseBranchStatement = this.statement();
    }
    return new IfStatement(condition, thenBranchStatement, elseBranchStatement);
  }

  // This will get called after we failed to find a declration statement.
  statement() {
    if (this.matchToken(TokenType.IF)) {
      return this.ifStatement();
    }
    if (this.matchToken(TokenType.PRINT)) {
      return this.printStatement();
    }
    // "{" indicates we are about to go into a new block.
    if (this.matchToken(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }
    // If nothing is found it's probably one of those things were the user just puts an expression with a semicolon.
    // For example: 1 + 2; Here we can say that the shown example is in fact an expression statement.
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
