import Parser from "./Parser.ts";
import Tokenizer from "./Tokenizer.ts";
import Interpreter from "./Interpreter.ts";

export default class REPL {
  // We can never know what type it will be when it returns because it never returns, it's returning itself.
  loop(): any {
    const input = prompt("tox:");
    if (input == null) {
      return this.loop();
    }
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.scanSource();
    const parser = new Parser(tokens);
    const interpretor = new Interpreter();
    const expression = parser.expression();
    if (expression) {
      console.log(expression);
      console.log(
        `${expression.toString()}`,
      );
      console.log(interpretor.evaluate(expression));
    }
    return this.loop();
  }
}
