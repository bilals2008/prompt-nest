const colorNames = ["blue", "green", "purple", "orange", "pink", "teal", "indigo", "rose"]

const colorMap = {
  blue: { bg: "bg-blue-100/50 dark:bg-blue-900/25", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200/50 dark:border-blue-800/30" },
  green: { bg: "bg-green-100/50 dark:bg-green-900/25", text: "text-green-700 dark:text-green-300", border: "border-green-200/50 dark:border-green-800/30" },
  purple: { bg: "bg-purple-100/50 dark:bg-purple-900/25", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200/50 dark:border-purple-800/30" },
  orange: { bg: "bg-orange-100/50 dark:bg-orange-900/25", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200/50 dark:border-orange-800/30" },
  pink: { bg: "bg-pink-100/50 dark:bg-pink-900/25", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200/50 dark:border-pink-800/30" },
  teal: { bg: "bg-teal-100/50 dark:bg-teal-900/25", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200/50 dark:border-teal-800/30" },
  indigo: { bg: "bg-indigo-100/50 dark:bg-indigo-900/25", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200/50 dark:border-indigo-800/30" },
  rose: { bg: "bg-rose-100/50 dark:bg-rose-900/25", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200/50 dark:border-rose-800/30" },
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
