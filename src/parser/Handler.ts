import { WorkspaceFolder, workspace, Position } from "vscode";
import { isArray } from "util";

export default class Handler {
  tokens: Array<any>;

  position: Position;

  aliases: Array<string>;

  constructor(tokens: Array<any>, position: Position, aliases: Array<string>) {
    this.tokens = tokens;

    this.position = position;

    this.aliases = aliases;
  }

  getEloquentAliasToken() {
    return this.getAliasToken();
  }

  getResourceAliasToken() {
    let aliasToken: Array<any> = [];

    for (let i = 0; i < this.tokens.length; i++) {
      if (
        i > 0 &&
        this.tokens[i - 1][0] === "T_CLASS" &&
        this.tokens[i][0] === "T_STRING" &&
        this.tokens[i][1].endsWith("Resource")
      ) {
        aliasToken = this.tokens[i];
      }

      if (
        this.tokens[i] === "{" &&
        this.tokens[i][0] !== "T_CONSTANT_ENCAPSED_STRING"
      ) {
        break;
      }
    }

    const lineTokens = this.tokens
      .filter((token: Array<any>) => {
        return token[2] === this.position.line + 1;
      })
      .reverse();

    for (let j = 0; j < lineTokens.length; j++) {
      if (!lineTokens[j][1].includes(">")) {
        break;
      }

      if (
        lineTokens[j][0] === "T_OBJECT_OPERATOR" &&
        lineTokens[j + 1][1] === "$this"
      ) {
        break;
      }

      if (
        lineTokens[j][0] !== "T_OBJECT_OPERATOR" ||
        lineTokens[j + 1][1] !== "T_VARIABLE"
      ) {
        return [];
      }
    }

    return aliasToken;
  }

  getFactoryAliasToken() {
    let aliasToken: Array<any> = [];

    const lineTokens = this.tokens
      .filter((token: Array<any>) => {
        return token[2] === this.position.line + 1;
      })
      .reverse();

    for (let j = 0; j < lineTokens.length; j++) {
      if (
        lineTokens[j][0] === "T_OBJECT_OPERATOR" ||
        lineTokens[j][0] === "T_DOUBLE_ARROW"
      ) {
        return [];
      }

      if (j >= 1 && lineTokens[j][0] !== "T_RETURN") {
        return [];
      }
    }

    if (lineTokens.length === 0) {
      return aliasToken;
    }

    const beforeTokens = this.tokens
      .slice(0, lineTokens[0][3])
      .filter((token) => isArray(token))
      .reverse();

    for (let i = 0; i < beforeTokens.length; i++) {
      if (
        beforeTokens.length > i + 3 &&
        beforeTokens[i + 1][0] === "T_STRING" &&
        beforeTokens[i + 1][1] === "define" &&
        beforeTokens[i + 2][0] === "T_OBJECT_OPERATOR" &&
        beforeTokens[i + 2][1] === "->" &&
        beforeTokens[i + 3][0] === "T_VARIABLE" &&
        beforeTokens[i + 3][1] === "$factory"
      ) {
        aliasToken = beforeTokens[i];
        break;
      }
    }

    return aliasToken;
  }

  hasAlias(): boolean {
    return this.getAliasToken().length > 0;
  }

  getAliasToken(): Array<any> {
    let aliasToken: Array<any> = [];

    const tokens = this.tokensOnTheSameLine();

    // Remove TRIGGER_CHARACTERS
    tokens.shift();

    const alias = tokens.shift();

    if (isArray(alias) && this.aliases.includes(alias[1])) {
      aliasToken = alias;
    }

    return aliasToken;
  }

  tokensOnTheSameLine(): Array<any> {
    return this.tokens
      .filter((token: Array<any>) => {
        return token[2] === this.position.line + 1;
      })
      .reverse();
  }
}
