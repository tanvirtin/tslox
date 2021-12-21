import {
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  PrintStatement,
  Statement,
  VariableStatement,
  WhileStatement,
} from "./Statement.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  Expression,
  IdentifierExpression,
  LiteralExpression,
  UnaryExpression,
} from "./Expression.ts";
import TokenType from "./TokenType.ts";
import Token from "./Token.ts";

// - A “left denotation”, short led, (most notably, infix (a.k.a binary) and postfix operators).
// - A “null denotation”, short nud, (can be anything not a left denotation, prefix operators, numbers, strings, identifiers, etc).

type NullDenotationParselet = () => Expression;
// Left denotation parselet will always take a left expression (binary will always have a left hand side or in the case of 1++ left expression for ++ is 1).
type LeftDenotationParselet = (leftExpression: Expression) => Expression;

export enum Precedence {
  LOWEST = 1,
  COND = 2,
  EQUALS = 3,
  LESSGREATER = 4,
  TERM = 5,
  FACTOR = 6,
  PREFIX = 7,
}

export default class Parser {
  private tokens: Token[];
  private cursor: number = 0;
  private nullDenotationParselets: Record<string, NullDenotationParselet> = {};
  private leftDenotationParslets: Record<string, LeftDenotationParselet> = {};
  private tokenPrecedence: Record<string, Precedence> = {
    [TokenType.AND]: Precedence.COND,
    [TokenType.OR]: Precedence.COND,
    [TokenType.EQUAL_EQUAL]: Precedence.EQUALS,
    [TokenType.BANG_EQUAL]: Precedence.EQUALS,
    [TokenType.GREATER]: Precedence.LESSGREATER,
    [TokenType.LESS]: Precedence.LESSGREATER,
    [TokenType.PLUS]: Precedence.TERM,
    [TokenType.MINUS]: Precedence.TERM,
    [TokenType.SLASH]: Precedence.FACTOR,
    [TokenType.STAR]: Precedence.FACTOR,
  };

  constructor(tokens: Token[]) {
    this.tokens = tokens;

    // Literals
    this.registerNullDenotationParselet(
      TokenType.NUMBER,
      this.literalParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.STRING,
      this.literalParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.FALSE,
      this.literalParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.TRUE,
      this.literalParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.NIL,
      this.literalParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.IDENTIFIER,
      this.variableParselet.bind(this),
    );
    // Grouping expression
    this.registerNullDenotationParselet(
      TokenType.LEFT_PAREN,
      this.groupingParselet.bind(this),
    );

    // Operators with no left expressions.
    this.registerNullDenotationParselet(
      TokenType.MINUS,
      this.unaryParselet.bind(this),
    );
    this.registerNullDenotationParselet(
      TokenType.BANG,
      this.unaryParselet.bind(this),
    );

    // Oeprators with left expressions.
    this.registerLeftDenotationParselet(
      TokenType.BANG_EQUAL,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.EQUAL_EQUAL,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.GREATER,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.GREATER_EQUAL,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.LESS,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.LESS_EQUAL,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.MINUS,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.PLUS,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.SLASH,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.STAR,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.OR,
      this.binaryParselet.bind(this),
    );
    this.registerLeftDenotationParselet(
      TokenType.AND,
      this.binaryParselet.bind(this),
    );
  }

  private registerNullDenotationParselet(
    token: TokenType,
    nullDenotationParselet: NullDenotationParselet,
  ) {
    this.nullDenotationParselets[token] = nullDenotationParselet;
  }

  private registerLeftDenotationParselet(
    token: TokenType,
    leftDenotationParselet: LeftDenotationParselet,
  ) {
    this.leftDenotationParslets[token] = leftDenotationParselet;
  }

  private literalParselet(): Expression {
    const token: Token = this.currentToken();
    return new LiteralExpression(token.literal);
  }

  private variableParselet(): Expression {
    const currentToken: Token = this.currentToken();
    const nextToken: Token = this.nextToken();
    if (nextToken.type === TokenType.EQUAL) {
      this.advanceToken();
      this.advanceToken();
      return new AssignmentExpression(
        currentToken,
        nextToken,
        this.expression(Precedence.LOWEST),
      );
    }
    return new IdentifierExpression(currentToken);
  }

  private groupingParselet(): Expression {
    // Advance the token first as we have successfully encountered a "(".
    this.advanceToken();
    const expression = this.expression(Precedence.LOWEST);
    // We have to make sure that the next token is actually a ")".
    this.assertNextToken(
      TokenType.RIGHT_BRACE,
      `Expected ")" after grouping expression got ${this.nextToken().lexeme} instead`,
    );
    // We advance the token again because we are expecting the next token to be ")".
    this.advanceToken();
    return expression;
  }

  // AKA prefixParselet.
  private unaryParselet(): Expression {
    // Store the current token.
    const operatorToken = this.currentToken();

    // After storing the current token which is the operator, we move to the next token, preparing us for our next expression call.
    this.advanceToken();

    // We call this.expression which kick starts a recursive call and this function will pend in the stack for the recursive calls to complete.
    // IMPORTANT: Higher the precedence the higher the binding power. For example 2 + 5 * 2, results in (2 + (5 * 2)) and not ((2 + 5) * 2) because "*" has
    //            a precedence of 5 in comparison to "+" which is a 4. This means "*" with it's higher binding power pulls the expression 5 away from "+".
    //            This is important, higher precedence on a BINARY/LEFT DENOTATION (LED) operator will increase it's LEFT binding power. This is why we give
    //            Prefix expressions (null denotation) such high precedence, so that the binary expression can trump their precedence and their left binding
    //            power will always be less.

    const rightExpression = this.expression(Precedence.PREFIX);

    return new UnaryExpression(operatorToken, rightExpression);
  }

  private binaryParselet(leftExpression: Expression): Expression {
    // Store the operator token.
    const operatorToken = this.currentToken();

    // Before we advance the token we also need to get the operator precedence.
    const operatorPrecedence: number = this.getTokenPrecedence(
      this.currentToken(),
    );

    // After storing the current token which is the operator, we move to the next token.
    this.advanceToken();

    // We call this.expression which kick starts a recursive call and this function will pend in the stack for the recursive calls to complete.
    const rightExpression = this.expression(operatorPrecedence);

    // An interesting thing to think about is the fact that, after the recursive call to this.expression, the internal
    // pointer to the list of tokens (this.cursor) may not be in the same place, because a lot might have happened
    // within the recursive call.

    return new BinaryExpression(leftExpression, operatorToken, rightExpression);
  }

  private previousToken(): Token {
    return this.tokens[this.cursor - 1];
  }

  private currentToken(): Token {
    return this.tokens[this.cursor];
  }

  private nextToken(): Token {
    return this.tokens[this.cursor + 1];
  }

  private getTokenPrecedence(token: Token): number {
    return this.tokenPrecedence[token.type] || Precedence.LOWEST;
  }

  // End of Token
  private endOfToken(): boolean {
    return this.currentToken().type === TokenType.EOF;
  }

  private checkCurrentToken(type: TokenType): boolean {
    if (this.endOfToken()) return false;
    return this.currentToken().type == type;
  }

  private checkNextToken(type: TokenType): boolean {
    if (this.endOfToken()) return false;
    return this.nextToken().type == type;
  }

  private matchCurrentToken(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.checkCurrentToken(type)) {
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
  private consumeCurrentToken(type: TokenType, message: string) {
    if (this.checkCurrentToken(type)) {
      const token = this.currentToken();
      this.advanceToken();
      return token;
    }
    throw new Error(message);
  }

  private assertCurrentToken(type: TokenType, message: string) {
    if (this.checkCurrentToken(type)) {
      throw new Error(message);
    }
  }

  private assertNextToken(type: TokenType, message: string) {
    if (this.checkNextToken(type)) {
      throw new Error(message);
    }
  }

  expression(currentPrecedence: number = Precedence.LOWEST): Expression {
    // We store the current token. We will always assume that the initial token will be a null denotation token.
    // Which can be a number, identifier, prefix operator, etc.
    const currentToken = this.currentToken();

    // We immediately retrieve the null denotation. Null denotation parsers will be any expression which does not require a left expression.
    const nullDenotationParselet =
      this.nullDenotationParselets[currentToken.type];

    // We always expect a null denotation when we call expression, if a token does not have a null denotation parselet associated with it then it's an error.
    if (nullDenotationParselet == null) {
      throw new Error(
        `Invalid expression, token: ${currentToken.lexeme} does not have a null denotation parselet associated with it`,
      );
    }

    // This may be the expression we return. Remember the expression we are parsing could just be a number.
    // It can also be the left expression for a binary operator coming up next which has it's right expression pending.
    let leftExpression = nullDenotationParselet();

    // Right now any token we encounter without a precedence associated with it will prevent the loop from being entered.
    // This mechanism should allow us to automatically leave this loop.
    // If we also encounter a precedence greater than the precedence passed to us we (technically our previous operator), we exit the loop.
    while (
      !this.endOfToken() &&
      // IMPORTANT: Higher the precedence the higher the binding power. For example 2 + 5 * 2, results in (2 + (5 * 2)) and not ((2 + 5) * 2) because "*" has
      //            a precedence of 5 in comparison to "+" which is a 4. This means "*" with it's higher binding power pulls the expression 5 away from "+".
      //            This is important, higher precedence on a BINARY/LEFT DENOTATION (LED) operator will increase it's LEFT binding power. This is why we give
      //            Prefix expressions (null denotation) such high precedence, so that the binary expression can trump their precedence and their left binding
      //            power will always be less.
      currentPrecedence <
        this.getTokenPrecedence(this.nextToken())
    ) {
      // If we are at this line, it means we actually encountered an operator with a greater precedence.
      // Which means we will have to eat the token and parse more expressions.
      this.advanceToken();

      // In this program we just have one type of left denotation parselet which is a binary expression. Don't get confused by the naming.
      const leftDenotationParselet =
        this.leftDenotationParslets[this.currentToken().type];

      if (leftDenotationParselet == null) {
        throw new Error(
          `Invalid expression, token: ${currentToken.lexeme} does not have a left denotation parselet associated with it`,
        );
      }

      // We pass our current left expression to be the left expression for the new binary operator and get back a
      // new left expression. We will check again in this loop if the next token is an operator with a greater precedence.
      leftExpression = leftDenotationParselet(leftExpression);
    }

    return leftExpression;
  }

  printStatement() {
    // NOTE: The search for tokens if none of the if statements are caught.
    //       Since the ";" token is not in the if statement, the look for
    //       tokens will end immediately returning us the expression made so far.
    const expression = this.expression(Precedence.LOWEST);
    if (expression == null) {
      throw new Error("No expression provided for the print statement");
    }
    this.advanceToken();
    this.consumeCurrentToken(
      TokenType.SEMICOLON,
      'Expected ";" after expression',
    );
    return new PrintStatement(expression);
  }

  expressionStatement() {
    const expression = this.expression(Precedence.LOWEST);
    if (expression == null) {
      throw new Error("No expression provided for the expression statement");
    }
    this.advanceToken();
    // We optionally consume the semi colon, this is because in some places the ";"
    // might be optional, for example in if statements, we don't need to do if (); {}
    // we can do if () {}
    this.matchCurrentToken(TokenType.SEMICOLON);
    return new ExpressionStatement(expression);
  }

  variableStatement() {
    const name: Token = this.consumeCurrentToken(
      TokenType.IDENTIFIER,
      "Expected variable name",
    );
    // We check if the next token is an equal.
    // NOTE**: We are not consuming the equal token, and this is not an assertion
    //         because users can define variables with a nil value such as var a;
    this.consumeCurrentToken(TokenType.EQUAL, 'Expected "=" after identifier');
    const expression = this.expression(Precedence.LOWEST);
    if (expression == null) {
      throw new Error("No expression provided for the expression statement");
    }
    this.advanceToken();
    this.consumeCurrentToken(
      TokenType.SEMICOLON,
      'Expected ";" after expression',
    );
    return new VariableStatement(name, expression);
  }

  // A block is a mini program with it's own series of statements.
  blockStatement() {
    const statements: Statement[] = [];
    // Until we haven't encountered a right brace or we have not reached the end of all tokens,
    // we will loop through the tokens and add all variable statements inside the list of statements.
    // Block for now will contain a series of statements.
    while (
      !this.checkCurrentToken(TokenType.RIGHT_BRACE) && !this.endOfToken()
    ) {
      statements.push(this.declaration());
    }
    // We will always expect a RIGHT_BRACE token to end a block.
    // If we reached the end of token before hitting a RIGHT_BRACE, program should error out.
    this.consumeCurrentToken(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return new BlockStatement(statements);
  }

  ifStatement(): Statement {
    // NOTE** - Parenthesis are optional for declaring conditions in an if statement.
    const condition: Expression = this.expression(Precedence.LOWEST);
    this.advanceToken();
    const thenBranchStatement: Statement = this.statement();
    let elseBranchStatement;
    if (this.matchCurrentToken(TokenType.ELSE)) {
      elseBranchStatement = this.statement();
    }
    return new IfStatement(condition, thenBranchStatement, elseBranchStatement);
  }

  whileStatement(): Statement {
    // NOTE** - Parenthesis are optional for declaring conditions in an if statement.
    const condition: Expression = this.expression(Precedence.LOWEST);
    this.advanceToken();
    const body: Statement = this.statement();
    return new WhileStatement(condition, body);
  }

  // This will get called after we failed to find a declration statement.
  statement() {
    if (this.matchCurrentToken(TokenType.IF)) {
      return this.ifStatement();
    }
    if (this.matchCurrentToken(TokenType.PRINT)) {
      return this.printStatement();
    }
    if (this.matchCurrentToken(TokenType.WHILE)) {
      return this.whileStatement();
    }
    // "{" indicates we are about to go into a new block.
    if (this.matchCurrentToken(TokenType.LEFT_BRACE)) {
      return this.blockStatement();
    }
    // If nothing is found it's probably one of those things were the user just puts an expression with a semicolon.
    // For example: 1 + 2; Here we can say that the shown example is in fact an expression statement.
    return this.expressionStatement();
  }

  // We look for declarations first, if we can't find a declaration it's probably some other type of statement.
  declaration() {
    if (this.matchCurrentToken(TokenType.VAR)) {
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
      const statement = this.declaration();
      statements.push(statement);
    }
    return statements;
  }
}
