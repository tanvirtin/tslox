export default class Tox {
  private static hadError: boolean = false;

  static error(line: number, message: string) {
    Tox.report(line, "", message);
  }

  static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] ${where}: ${message}`);
    Tox.hadError = true;
  }
}
