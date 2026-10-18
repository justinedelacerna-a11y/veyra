/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("node:module")
const origRequire = Module.prototype.require

Module.prototype.require = function (id) {
  if (id === "server-only") {
    return {}
  }
  return origRequire.apply(this, arguments)
}
