import Evaluator from "../src/Evaluator.ts";
import Scanner from "../src/Scanner.ts";
import Parser from "../src/Parser.ts";

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("evaluate", () => {
  const assertionTable: Record<string, number> = {
    "2 + 2 * 5": 12,
  };

  const evaluator = new Evaluator();

  for (const source in assertionTable) {
    const expected = assertionTable[source];
    const scanner = new Scanner(source);
    const parser = new Parser(scanner.scanSource());
    const expression = parser.expression();
    assertExists(expression);
    const result = expression.evaluate(evaluator);
    assertEquals(result, expected);
  }
});
