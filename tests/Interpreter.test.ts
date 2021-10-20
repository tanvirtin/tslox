import Interpreter from "../src/Interpreter.ts";
import Tokenizer from "../src/Tokenizer.ts";
import Parser from "../src/Parser.ts";

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("evaluate", () => {
  const assertionTable: Record<string, any> = {
    "true": true,
    "false": false,
    "1": 1,
    "nil": false,
    '"hello world"': "hello world",
    "2 + 2 * 5": 12,
    "2 * 5 - 2": 8,
    "1 + 2 * 3 - 2": 5,
    "1 + 2 + 3": 6,
    "5 > 4 == 3 < 4": true,
    "3 < 5 == true": true,
    "3 > 5 == false": true,
    "5 < 4 != 3 > 4": false,
    "3 + 4 * 5 == 3 * 1 + 4 * 5": true,
    "1 + (2 + 3) + 4": 10,
    "(5 + 5) * 2": 20,
    "2 / (5 + 5)": 0.2,
    "(5 + 5) * 2 * (5 + 5)": 200,
    "-32 * 2": -64,
    "1 - - - - - 1": 0,
    "1 - - - - - 1 * 3": -2,
    "!-32": false,
    "-(5 + 5)": -10,
    "!true == true": false,
    "!(true == true)": false,
    "!(1 * 0)": true,
  };

  const interpreter = new Interpreter();

  for (const source in assertionTable) {
    const expected = assertionTable[source];
    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.scanSource();
    const parser = new Parser(tokens);
    const expression = parser.expression();
    assertExists(expression);
    const evaluation = interpreter.evaluate(expression);
    assertEquals(evaluation, expected);
  }
});
