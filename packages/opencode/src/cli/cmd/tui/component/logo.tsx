import { TextAttributes, RGBA } from "@opentui/core"
import { For, createSignal, onMount, createResource, type JSX } from "solid-js"
import { useTheme, tint } from "@tui/context/theme"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SHADOW_MARKER = /[_^~]/

async function loadLogoData(): Promise<{ left: string[]; right: string[] }> {
  const leftPath = join(__dirname, "..", "..", "..", "..", "logo", "left.md")
  const rightPath = join(__dirname, "..", "..", "..", "..", "logo", "right.md")

  const left = await Bun.file(leftPath).text()
  const right = await Bun.file(rightPath).text()

  return {
    left: left.split("\n").filter((l) => l.length > 0),
    right: right.split("\n").filter((l) => l.length > 0),
  }
}

export function Logo() {
  const { theme } = useTheme()
  const [logo] = createResource(loadLogoData)

  const renderLine = (line: string, fg: RGBA, bold: boolean): JSX.Element[] => {
    const shadow = tint(theme.background, fg, 0.25)
    const attrs = bold ? TextAttributes.BOLD : undefined
    const elements: JSX.Element[] = []
    let i = 0

    while (i < line.length) {
      const rest = line.slice(i)
      const markerIndex = rest.search(SHADOW_MARKER)

      if (markerIndex === -1) {
        elements.push(
          <text fg={fg} attributes={attrs} selectable={false}>
            {rest}
          </text>,
        )
        break
      }

      if (markerIndex > 0) {
        elements.push(
          <text fg={fg} attributes={attrs} selectable={false}>
            {rest.slice(0, markerIndex)}
          </text>,
        )
      }

      const marker = rest[markerIndex]
      switch (marker) {
        case "_":
          elements.push(
            <text fg={fg} bg={shadow} attributes={attrs} selectable={false}>
              {" "}
            </text>,
          )
          break
        case "^":
          elements.push(
            <text fg={fg} bg={shadow} attributes={attrs} selectable={false}>
              ▀
            </text>,
          )
          break
        case "~":
          elements.push(
            <text fg={shadow} attributes={attrs} selectable={false}>
              ▀
            </text>,
          )
          break
      }

      i += markerIndex + 1
    }

    return elements
  }

  return (
    <box>
      <For each={logo()?.left ?? []}>
        {(line, index) => (
          <box flexDirection="row" gap={1}>
            <box flexDirection="row">{renderLine(line, theme.textMuted, false)}</box>
            <box flexDirection="row">{renderLine(logo()?.right[index()] ?? "", theme.text, true)}</box>
          </box>
        )}
      </For>
    </box>
  )
}
