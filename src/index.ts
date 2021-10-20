import REPL from "./REPL.ts";
import CLI from "./CLI.ts";

(function (): void {
  const repl = new REPL();
  const cli = new CLI(repl);
  cli.start();
})();
