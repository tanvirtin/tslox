import Parser from "./Parser.ts";
import Tokenizer from "./Tokenizer.ts";
import Interpreter from "./Interpreter.ts";

export default class REPL {
  private interpreter: Interpreter;

  constructor() {
    this.interpreter = new Interpreter();
  }
  // We can never know what type it will be when it returns because it never returns, it's returning itself.
  loop(): any {
    const input = prompt("tox:");
    if (input == null) {
      return this.loop();
    }
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    try {
      const statements = parser.parse();
      this.interpreter.interpret(statements);
    } catch (err) {
      console.error(err);
    }
    return this.loop();
  }
}
