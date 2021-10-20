import Parser from "./Parser.ts";
import Tokenizer from "./Tokenizer.ts";
import Interpreter from "./Interpreter.ts";

import REPL from "./REPL.ts";

export default class CLI {
  private args: string[];
  private repl: REPL;

  constructor(repl: REPL) {
    this.args = Deno.args;
    this.repl = repl;
  }

  argsIsEmpty(): boolean {
    return this.args.length === 0;
  }

  async runFile(path: string) {
    if (path.length == 0) {
      throw new Error("Must profile filepath");
    }
    const source = await Deno.readTextFile(path).catch((err) => {
      console.error(err);
      Deno.exit(1);
    });
    const tokenizer = new Tokenizer(source);
    const parser = new Parser(tokenizer.scanSource());
    const interpretor = new Interpreter();
    interpretor.interpret(parser.parse());
  }

  start(): void {
    if (this.argsIsEmpty()) {
      return this.repl.loop();
    }

    this.runFile(this.args[0]);
  }
}
