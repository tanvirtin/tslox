import Parser from './Parser.ts';
import Scanner from './Scanner.ts';

const scanner = new Scanner("2 == ? 3 : 4");
const parser = new Parser(scanner.scanSource());

console.log(parser.expression().toString());