import TokenType from "./TokenType.ts";

export default class Token {
  type: TokenType;
  // The lexeme variable will be the actual character/words from the source code related to this token.
  lexeme: string;
  // The literal value is similar to lexeme, but it will be used to contain more specific values.
  // For example if you have a string "Hello, World!", the lexeme will be "Hello, World!" and the
  // literal value will be Hello, World! without the "".
  literal: any;
  line: number;

  constructor(
    type: TokenType,
    lexeme: string,
    literal: any,
    line: number,
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString(): string {
    return `<Token type=${this.type} lexeme=${this.lexeme}${
      this.literal != null ? ` literal=${this.literal}` : ""
    } />`;
  }
}
