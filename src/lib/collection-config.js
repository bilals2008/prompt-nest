import {
  IconFolder,
  IconStar,
  IconHeart,
  IconBookmark,
  IconTag,
} from "@tabler/icons-react"

import { colorMap } from "@/lib/tag-colors"

const collectionIcons = {
  folder: { icon: IconFolder },
  star: { icon: IconStar },
  heart: { icon: IconHeart },
  bookmark: { icon: IconBookmark },
  tag: { icon: IconTag },
}

const iconOptions = [
  { value: "folder", label: "Folder", icon: IconFolder },
  { value: "star", label: "Star", icon: IconStar },
  { value: "heart", label: "Heart", icon: IconHeart },
  { value: "bookmark", label: "Bookmark", icon: IconBookmark },
  { value: "tag", label: "Tag", icon: IconTag },
]

// icon-based default colors (fallback)
const iconDefaultColors = {
  folder: "blue", star: "amber", heart: "rose",
  bookmark: "purple", tag: "green",
}

function getCollectionIcon(iconName) {
  return collectionIcons[iconName]?.icon || IconFolder
}

function getCollectionColor(colorName, iconName) {
  const name = colorName || iconDefaultColors[iconName] || "blue"
  return colorMap[name] || colorMap.blue
}

export { collectionIcons, iconOptions, getCollectionIcon, getCollectionColor, iconDefaultColors }
