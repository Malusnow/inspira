const functionName = Symbol.for("functionName")

function createApi(pathParts = []) {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (typeof prop === "string") {
          return createApi([...pathParts, prop])
        }

        if (prop === functionName) {
          const path = pathParts.slice(0, -1).join("/")
          const exportName = pathParts[pathParts.length - 1]
          return exportName === "default" ? path : `${path}:${exportName}`
        }

        if (prop === Symbol.toStringTag) {
          return "FunctionReference"
        }

        return undefined
      },
    },
  )
}

export const api = createApi()
