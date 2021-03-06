import Tokenizer from "../src/Tokenizer.ts";

import { assertEquals } from "https://deno.land/std@0.110.0/testing/asserts.ts";

Deno.test("tokenize", () => {
  const assertionTable: Record<string, string[]> = {
    "(": ["<Token type=LEFT_PAREN lexeme=( />"],
    ")": ["<Token type=RIGHT_PAREN lexeme=) />"],
    "{": ["<Token type=LEFT_BRACE lexeme={ />"],
    "}": ["<Token type=RIGHT_BRACE lexeme=} />"],
    ",": ["<Token type=COMMA lexeme=, />"],
    ".": ["<Token type=DOT lexeme=. />"],
    "-": ["<Token type=MINUS lexeme=- />"],
    "+": ["<Token type=PLUS lexeme=+ />"],
    ";": ["<Token type=SEMICOLON lexeme=; />"],
    "*": ["<Token type=STAR lexeme=* />"],
    "!": ["<Token type=BANG lexeme=! />"],
    "!=": ["<Token type=BANG_EQUAL lexeme=!= />"],
    "=": ["<Token type=EQUAL lexeme== />"],
    "==": ["<Token type=EQUAL_EQUAL lexeme=== />"],
    "<": ["<Token type=LESS lexeme=< />"],
    "<=": ["<Token type=LESS_EQUAL lexeme=<= />"],
    ">": ["<Token type=GREATER lexeme=> />"],
    ">=": ["<Token type=GREATER_EQUAL lexeme=>= />"],
    '"Hello, World!"': [
      '<Token type=STRING lexeme="Hello, World!" literal=Hello, World! />',
    ],
    "// hello world": [],
    "/": ["<Token type=SLASH lexeme=/ />"],
    " ": [],
    "\r": [],
    "\t": [],
    "\n": [],
    "1234": ["<Token type=NUMBER lexeme=1234 literal=1234 />"],
    "12.23": ["<Token type=NUMBER lexeme=12.23 literal=12.23 />"],
    "12.55.23": [
      "<Token type=NUMBER lexeme=12.55 literal=12.55 />",
      "<Token type=DOT lexeme=. />",
      "<Token type=NUMBER lexeme=23 literal=23 />",
    ],
    "foobar": ["<Token type=IDENTIFIER lexeme=foobar />"],
    "foo1bar": ["<Token type=IDENTIFIER lexeme=foo1bar />"],
    "and": ["<Token type=AND lexeme=and />"],
    "class": ["<Token type=CLASS lexeme=class />"],
    "else": ["<Token type=ELSE lexeme=else />"],
    "false": ["<Token type=FALSE lexeme=false literal=false />"],
    "for": ["<Token type=FOR lexeme=for />"],
    "fun": ["<Token type=FUN lexeme=fun />"],
    "if": ["<Token type=IF lexeme=if />"],
    "nil": ["<Token type=NIL lexeme=nil literal=false />"],
    "or": ["<Token type=OR lexeme=or />"],
    "print": ["<Token type=PRINT lexeme=print />"],
    "return": ["<Token type=RETURN lexeme=return />"],
    "super": ["<Token type=SUPER lexeme=super />"],
    "this": ["<Token type=THIS lexeme=this />"],
    "true": ["<Token type=TRUE lexeme=true literal=true />"],
    "var": ["<Token type=VAR lexeme=var />"],
    "while": ["<Token type=WHILE lexeme=while />"],
  };
  for (const source in assertionTable) {
    const expectedTokenStrings = assertionTable[source];
    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.tokenize();
    for (let i = 0; i < tokens.length - 1; ++i) {
      const token = tokens[i];
      const expectedTokenString = expectedTokenStrings[i];
      assertEquals(token.toString(), expectedTokenString);
    }
    assertEquals(
      tokens[tokens.length - 1].toString(),
      "<Token type=EOF lexeme=\0 />",
    );
  }
});

Deno.test("single line comment", () => {
  const source = `
    // Hello world
    3
  `;
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  assertEquals(tokens.length, 2);
  assertEquals(
    tokens[0].toString(),
    "<Token type=NUMBER lexeme=3 literal=3 />",
  );
  assertEquals(tokens[1].toString(), "<Token type=EOF lexeme=\0 />");
});

Deno.test("multi line comment", () => {
  const source = `
    /* Hello world
    */
    3
  `;
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  assertEquals(tokens.length, 2);
  assertEquals(
    tokens[0].toString(),
    "<Token type=NUMBER lexeme=3 literal=3 />",
  );
  assertEquals(tokens[1].toString(), "<Token type=EOF lexeme=\0 />");
});

Deno.test("unfinished multi line comment", () => {
  const source = `
    /* Hello world
    *
    3
  `;
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  assertEquals(tokens.length, 1);
  assertEquals(tokens[0].toString(), "<Token type=EOF lexeme=\0 />");
});
