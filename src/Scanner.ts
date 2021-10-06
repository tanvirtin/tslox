import Tox from "./Tox.ts";
import Token from "./Token.ts";
import TokenType from "./TokenType.ts";

export default class Scanner {
  // The input source code.
  private source: string;
  // The list of tokens we are going to accumulate from the source input.
  private tokens: Token[] = [];
  // The start index points to the first character in the lexeme being scanned.
  private start: number = 0;
  // The current index points at the character currently being considered.
  private current: number = 0;
  // The line number tracks the line currently being tokenized.
  private line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  private addToken(type: TokenType, literal?: any): void {
    // NOTE: before we advanced this.current, we noted down this.start,
    // using the two index, we get the word in the source associated with this token.
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  private advance(): string {
    const currentCharacter = this.source[this.current];
    // We return the current character being looked at and advance to the next character.
    ++this.current;
    return currentCharacter;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] != expected) return false;
    // We only consume the current character if it's what we are looking for.
    ++this.current;
    return true;
  }

  private peek(): string {
    // Anything beyond the input source length is a null identifier.
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext(): string {
    // If value that the lexer isn't pointing to is greater than or equal to te length of the source,
    // we return null string identifier. Anything beyone the length of the string is a null string.
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private isDigit(char: string): boolean {
    return !isNaN(parseInt(char));
  }

  private isAlphabet(char: string) {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") ||
      char === "_";
  }

  private isAlphanumeric(char: string) {
    return this.isDigit(char) || this.isAlphabet(char);
  }

  private identifier(): void {
    // Numbers are allowed in variables.
    while (this.isAlphanumeric(this.peek())) {
      this.advance();
    }

    // Once we encounter something that is neither a digit or a number, we extract the text between the range.
    const text: string = this.source.substring(this.start, this.current);

    const keywords: Record<string, TokenType> = {
      "and": TokenType.AND,
      "class": TokenType.CLASS,
      "else": TokenType.ELSE,
      "false": TokenType.FALSE,
      "for": TokenType.FOR,
      "fun": TokenType.FUN,
      "if": TokenType.IF,
      "nil": TokenType.NIL,
      "or": TokenType.OR,
      "print": TokenType.PRINT,
      "return": TokenType.RETURN,
      "super": TokenType.SUPER,
      "this": TokenType.THIS,
      "true": TokenType.TRUE,
      "var": TokenType.VAR,
      "while": TokenType.WHILE,
    };

    // If text is actually a keyword we return what we find from the map.
    // NOTE: This means that identifiers can either be variables or keywords defined within the system.
    if (text in keywords) {
      this.addToken(keywords[text]);
    } else {
      this.addToken(TokenType.IDENTIFIER);
    }
  }

  private number(): void {
    // As long as there is a number we seen in the horizon we advance.
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // At this moment we might actually have encounted a ".", in that case lets handle it.
    // If we did encounter a "." then we check if the character next to it is a number.
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // We consume the "." we encountered.
      this.advance();

      // After that we advance the lexer until we no longer encounter a digi.
      // This means that if we encountered another ".", e.g the second "." in 12.33.23,
      // it would break the inner while loop as well as the outer one.
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current)),
    );
  }

  private string(): void {
    // Notice there is no '\n' in the while loop condition, this is because Tox supports multi line strings.
    while (this.peek() !== '"' && !this.isAtEnd()) {
      // If we do encounter a new line we increment the line number.
      if (this.peek() == "\n") {
        ++this.line;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      Tox.error(this.line, "String not ended.");
      return;
    }

    // We close the ".
    this.advance();

    // A string will look like this "<string contents>" and we only need the string contents not the quotes.
    // NOTE: We keep everything within the quotes even new lines.
    const value: string = this.source.substring(
      this.start + 1,
      this.current - 1,
    );

    this.addToken(TokenType.STRING, value);
  }

  // Scan the current source character to match a specific language known lexeme.
  // Scanner will advance more if it needs to extract a specific lexeme from a sequences of chars.
  private scanChar(): void {
    // At each scanChar call, we are going to be dealing with a new lexeme, and therefore new start.
    this.start = this.current;
    // NOTE: Each time this.advance method is called, this.current is going to point to the next character.
    // NOTE: When you call this.match or this.peek after this line, all operations will be done on the next
    //       character in this.source.
    const char = this.advance();

    switch (char) {
      case "(": {
        this.addToken(TokenType.LEFT_PAREN);
        break;
      }
      case ")": {
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      }
      case "{": {
        this.addToken(TokenType.LEFT_BRACE);
        break;
      }
      case "}": {
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      }
      case ",": {
        this.addToken(TokenType.COMMA);
        break;
      }
      case ".": {
        this.addToken(TokenType.DOT);
        break;
      }
      case "-": {
        this.addToken(TokenType.MINUS);
        break;
      }
      case "+": {
        this.addToken(TokenType.PLUS);
        break;
      }
      case ";": {
        this.addToken(TokenType.SEMICOLON);
        break;
      }
      case "*": {
        this.addToken(TokenType.STAR);
        break;
      }
      // Two character token, this character can either be ! or !=.
      case "!": {
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      }
      // Two character token, this character can either be = or ==.
      case "=": {
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL,
        );
        break;
      }
      // Two character token, this character can either be < or <=.
      case "<": {
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      }
      // Two character token, this character can either be > or >=.
      case ">": {
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER,
        );
        break;
      }
      case '"':
        this.string();
        break;
      // The case for "/" is a bit special as this character not only indicates division but also handles comments as well.
      case "/": {
        if (this.match("/")) {
          // We advance until we are at the end of the line or at the end of the input.
          // Ideally all characters until the end of the line will get consumed.
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      }
      case " ":
        // We don't care about whitespace.
        break;
      case "\r":
        // We don't care about carriage returns.
        break;
      case "\t":
        // We don't care about tabs.
        break;
      case "\n":
        // We don't care about new lines, buf if we encounter a new line we increment the line counter.
        ++this.line;
        break;
      default: {
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlphabet(char)) {
          this.identifier();
        } else {
          // NOTE: we don't end the program when we encounter a tokenizing error, we just report it.
          // Anytime we report an error Tox.hadError flag gets set to true, then later down
          // the road we can make sure not to execute the code.
          Tox.error(this.line, "Unexpected character.");
        }
        break;
      }
    }
  }

  scanSource(): Token[] {
    while (!this.isAtEnd()) {
      // Each time we are in the loop body we scan the char for a potential lexeme.
      this.scanChar();
    }
    this.tokens.push(new Token(TokenType.EOF, "\0", undefined, this.line));
    return this.tokens;
  }
}
