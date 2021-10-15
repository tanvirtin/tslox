import Scanner from "../src/Scanner.ts";
import Parser from "../src/Parser.ts";

import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("parse", () => {
  const scanner = new Scanner("2 + 2 * 5");
  const parser = new Parser(scanner.scanSource());
  assertEquals(parser.expression().toString(), "((2) + ((2) * (5)))");
});
