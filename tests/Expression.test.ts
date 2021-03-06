import TokenType from "../src/TokenType.ts";
import Token from "../src/Token.ts";
import * as Expression from "../src/Expression.ts";

import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("Literal", () => {
  const literalExpression = new Expression.LiteralExpression(123);
  assertEquals(literalExpression.toString(), "123");
});

Deno.test("Unary", () => {
  const unaryExpression = new Expression.UnaryExpression(
    new Token(TokenType.MINUS, "-", undefined, 1),
    new Expression.LiteralExpression(123),
  );
  assertEquals(unaryExpression.toString(), "(- 123)");
});

Deno.test("Binary", () => {
  const binaryExpression = new Expression.BinaryExpression(
    new Expression.LiteralExpression(42),
    new Token(TokenType.MINUS, "-", undefined, 1),
    new Expression.LiteralExpression(123),
  );
  assertEquals(binaryExpression.toString(), "(42 - 123)");
});
