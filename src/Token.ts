import TokenType from "./TokenType.ts";

export default class Token {
  type: TokenType;
  // The lexeme variable will be the actual character/words from the source code related to this token.
  lexeme: String;
  // The literal variable will contain any tangible value that can be associated with this token.
  literal: any;
  line: number;

  constructor(
    type: TokenType,
    lexeme: String,
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
