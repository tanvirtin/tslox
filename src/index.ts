import Parser from "./Parser.ts";
import Scanner from "./Scanner.ts";

const scanner = new Scanner("3 + 4 * 5 == 3 * 1 + 4 * 5");
const parser = new Parser(scanner.scanSource());

const expression = parser.expression();
if (expression) {
  console.log(expression);
  console.log(expression.toString());
}
