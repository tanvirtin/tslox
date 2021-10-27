import Tokenizer from "../src/Tokenizer.ts";
import Parser from "../src/Parser.ts";

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("expression", () => {
  const assertionTable: Record<string, string> = {
    "true": "true",
    "false": "false",
    "1": "1",
    "nil": "false",
    '"hello world"': "hello world",
    "2 + 2 * 5": "(2 + (2 * 5))",
    "2 * 5 - 2": "((2 * 5) - 2)",
    "1 + 2 * 3 - 2": "((1 + (2 * 3)) - 2)",
    "1 + 2 + 3": "((1 + 2) + 3)",
    "5 > 4 == 3 < 4": "((5 > 4) == (3 < 4))",
    "5 < 4 != 3 > 4": "((5 < 4) != (3 > 4))",
    "3 + 4 * 5 == 3 * 1 + 4 * 5": "((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))",
    "1 + (2 + 3) + 4": "((1 + (2 + 3)) + 4)",
    "(5 + 5) * 2": "((5 + 5) * 2)",
    "2 / (5 + 5)": "(2 / (5 + 5))",
    "(5 + 5) * 2 * (5 + 5)": "(((5 + 5) * 2) * (5 + 5))",
    "-32 * 2": "((- 32) * 2)",
    "1 - - - - - 1": "(1 - (- (- (- (- 1)))))",
    "1 - - - - - 1 * 3": "(1 - ((- (- (- (- 1)))) * 3))",
    "!-32": "(! (- 32))",
    "-(5 + 5)": "(- (5 + 5))",
    "!true == true": "((! true) == true)",
    "!(true == true)": "(! (true == true))",
    "3 < 5 == true": "((3 < 5) == true)",
    "3 > 5 == false": "((3 > 5) == false)",
    "!(1 * 0)": "(! (1 * 0))",
    "!(true and true)": "(! (true and true))",
    "2 * 5 + 1 and 1": "(((2 * 5) + 1) and 1)",
    // "a = 3 + 3 * 2": "a = (3 + (3 * 2))",
    // "a = (1 + 2) * 3": "a = ((1 + 2) * 3)",
    // "a = -3": "a = (- 3)",
  };

  for (const source in assertionTable) {
    const expected = assertionTable[source];
    const tokenizer = new Tokenizer(source);
    const parser = new Parser(tokenizer.tokenize());
    const expression = parser.expression();
    assertExists(expression);
    assertEquals(expression.toString(), expected);
  }
});
