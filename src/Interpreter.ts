import Environment from "./Environment.ts";
import TokenType from "./TokenType.ts";
import { Expression } from "./Expression.ts";
import {
  BlockStatement,
  IfStatement,
  Statement,
  VariableStatement,
  WhileStatement,
} from "./Statement.ts";
import {
  AssignmentExpression,
  BinaryExpression,
  LiteralExpression,
  UnaryExpression,
  VariableExpression,
} from "./Expression.ts";

// Interpreter is really a visitor for the expression nodes of the abstract syntax tree.
// Remember Abstract Syntax Tree itself is abstract it does not exist, it is only a group
// of expressions really, it has nothing else to do with it.
export default class Interpreter {
  private environment: Environment;

  constructor() {
    this.environment = new Environment();
  }

  literalExpression(expression: LiteralExpression): any {
    return expression.value;
  }

  // TODO: Needs Tweak.
  binaryExpression(expression: BinaryExpression) {
    const left = expression.left?.evaluate(this);
    const right = expression.right?.evaluate(this);

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
      case TokenType.OR:
        return left || right;
      case TokenType.AND:
        return left && right;
    }

    return null;
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

  // Retrieves a variable from the environment.
  variableExpression(expression: VariableExpression) {
    // We retrieve the variable from the environment using the token.
    return this.environment.get(expression.name);
  }

  // Heart of the assignment logic.
  assignmentExpression(expression: AssignmentExpression) {
    // Evaluate the right side and extract the value.
    const value = this.evaluate(expression.right);
    // Then assign
    this.environment.assign(expression.left, value);
    return value;
  }

  expressionStatement(statement: Statement) {
    // We are simply just going to evaluate the expression that is encapsulated using the statement.
    this.evaluate(statement.expression);
  }

  printStatement(statement: Statement) {
    const value = this.evaluate(statement.expression);
    // We levarage deno to flush the literal to stdout.
    console.log(value);
  }

  variableStatement(statement: VariableStatement) {
    let value;
    if (statement.expression != null) {
      value = this.evaluate(statement.expression);
    }
    this.environment.define(statement.name.lexeme, value);
  }

  blockStatement(blockStatement: BlockStatement) {
    const previous = this.environment;
    // Replace the current environment with a new environment.
    // But we make sure that the new environment points to the previous one.
    this.environment = new Environment(this.environment);
    try {
      for (const statement of blockStatement.statements) {
        this.execute(statement);
      }
    } catch (err) {
      // On any error we recover the previous environment.
      this.environment = previous;
      throw err;
    }
  }

  ifStatement(ifStatement: IfStatement) {
    if (!!this.evaluate(ifStatement.condition)) {
      this.execute(ifStatement.thenBranchStatement);
    } else if (ifStatement.elseBranchStatement != null) {
      this.execute(ifStatement.elseBranchStatement);
    }
  }

  whileStatement(whileStatement: WhileStatement) {
    while (!!this.evaluate(whileStatement.condition)) {
      this.execute(whileStatement.body);
    }
  }

  evaluate(expression: Expression | undefined) {
    console.log(expression)
    return expression?.evaluate(this);
  }

  execute(statement: Statement | undefined) {
    return statement?.execute(this);
  }

  interpret(statements: Statement[]) {
    for (const statement of statements) {
      this.execute(statement);
    }
  }
}
