import Scanner from "../src/Scanner.ts";
import Parser from "../src/Parser.ts";

import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("expression", () => {
  const assertionTable: Record<string, string> = {
    '2 + 2 * 5': "((2) + ((2) * (5)))",
    '2 * 5 - 2': "(((2) * (5)) - (2))"
  }

  for (const source in assertionTable) {
    const expected = assertionTable[source];
    const scanner = new Scanner(source);
    const parser = new Parser(scanner.scanSource());
    assertEquals(parser.expression().toString(), expected);
  } 
});
