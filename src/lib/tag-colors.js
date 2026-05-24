const colorNames = ["blue", "green", "purple", "orange", "pink", "teal", "indigo", "rose"]

const colorMap = {
  blue: { bg: "bg-blue-200/70 dark:bg-blue-800/70", text: "text-blue-800 dark:text-blue-200", border: "border-blue-300/50 dark:border-blue-700/50" },
  green: { bg: "bg-green-200/70 dark:bg-green-800/70", text: "text-green-800 dark:text-green-200", border: "border-green-300/50 dark:border-green-700/50" },
  purple: { bg: "bg-purple-200/70 dark:bg-purple-800/70", text: "text-purple-800 dark:text-purple-200", border: "border-purple-300/50 dark:border-purple-700/50" },
  orange: { bg: "bg-orange-200/70 dark:bg-orange-800/70", text: "text-orange-800 dark:text-orange-200", border: "border-orange-300/50 dark:border-orange-700/50" },
  pink: { bg: "bg-pink-200/70 dark:bg-pink-800/70", text: "text-pink-800 dark:text-pink-200", border: "border-pink-300/50 dark:border-pink-700/50" },
  teal: { bg: "bg-teal-200/70 dark:bg-teal-800/70", text: "text-teal-800 dark:text-teal-200", border: "border-teal-300/50 dark:border-teal-700/50" },
  indigo: { bg: "bg-indigo-200/70 dark:bg-indigo-800/70", text: "text-indigo-800 dark:text-indigo-200", border: "border-indigo-300/50 dark:border-indigo-700/50" },
  rose: { bg: "bg-rose-200/70 dark:bg-rose-800/70", text: "text-rose-800 dark:text-rose-200", border: "border-rose-300/50 dark:border-rose-700/50" },
}

const colors = Object.values(colorMap)

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function parseTag(raw) {
  const parts = raw.trim().split(":")
  const name = parts[0].trim()
  const colorName = parts.length > 1 && colorMap[parts[1]] ? parts[1] : null
  return { name, colorName, raw: name + (colorName ? `:${colorName}` : "") }
}

function getTagColor(tag) {
  const { name, colorName } = parseTag(tag)
  if (colorName) return colorMap[colorName]
  return colors[hash(name.toLowerCase()) % colors.length]
}

function getTagColorDot(colorName) {
  const dotMap = {
    blue: "bg-blue-500", green: "bg-green-500", purple: "bg-purple-500",
    orange: "bg-orange-500", pink: "bg-pink-500", teal: "bg-teal-500",
    indigo: "bg-indigo-500", rose: "bg-rose-500",
  }
  return dotMap[colorName] || "bg-muted-foreground"
}

export { getTagColor, getTagColorDot, parseTag, colorNames, colorMap }
