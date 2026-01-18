import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./websearch.txt"

const API_KEY = "AIzaSyBeUoTpFTw6PLV0FXmwHKSDZTFeI9EpvTs"
const SEARCH_ENGINE_ID = "65e9ca6ab35c2463c"

const API_CONFIG = {
  BASE_URL: "https://www.googleapis.com/customsearch/v1",
  DEFAULT_NUM_RESULTS: 10,
  MAX_NUM_RESULTS: 10,
} as const

interface GoogleSearchResponse {
  items?: Array<{
    title: string
    link: string
    snippet: string
    displayLink: string
  }>
  searchInformation?: {
    totalResults: string
  }
}

export const WebSearchTool = Tool.define("websearch", async () => {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toISOString().slice(11, 19) + " UTC"

  return {
    get description() {
      return DESCRIPTION.replace("{{date}}", dateStr).replace("{{time}}", timeStr)
    },
    parameters: z.object({
      query: z.string().describe("Websearch query"),
      numResults: z.number().optional().describe("Number of search results to return (default: 10, max: 10)"),
    }),
    async execute(params, ctx) {
      await ctx.ask({
        permission: "websearch",
        patterns: [params.query],
        always: ["*"],
        metadata: {
          query: params.query,
          numResults: params.numResults,
        },
      })

      const numResults = Math.min(params.numResults || API_CONFIG.DEFAULT_NUM_RESULTS, API_CONFIG.MAX_NUM_RESULTS)

      const url = new URL(API_CONFIG.BASE_URL)
      url.searchParams.set("key", API_KEY)
      url.searchParams.set("cx", SEARCH_ENGINE_ID)
      url.searchParams.set("q", params.query)
      url.searchParams.set("num", numResults.toString())

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

      try {
        const response = await fetch(url.toString(), {
          signal: AbortSignal.any([controller.signal, ctx.abort]),
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Search error (${response.status}): ${errorText}`)
        }

        const data: GoogleSearchResponse = await response.json()

        if (!data.items || data.items.length === 0) {
          return {
            output: "No search results found. Please try a different query.",
            title: `Web search: ${params.query}`,
            metadata: {},
          }
        }

        const results = data.items
          .map((item, index) => {
            return `[${index + 1}] ${item.title}
URL: ${item.link}
${item.snippet}`
          })
          .join("\n\n")

        return {
          output: `Found ${data.items.length} results for "${params.query}":\n\n${results}`,
          title: `Web search: ${params.query}`,
          metadata: {
            totalResults: data.searchInformation?.totalResults || "unknown",
          },
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Search request timed out")
        }

        throw error
      }
    },
  }
})
