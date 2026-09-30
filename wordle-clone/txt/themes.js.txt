export const THEMES = {
  classic: {
    label: "Classic",
    words: null
  },
  food: {
    label: "Food",
    words: [
      "pasta", "pizza", "bread", "bagel", "mango", "lemon", "grape", "peach",
      "apple", "salad", "curry", "sushi", "tacos", "olive", "onion", "basil",
      "candy", "cocoa", "cream", "crepe", "donut", "fudge", "gravy", "honey",
      "jelly", "melon", "pecan", "sauce", "steak", "toast", "wafer", "bacon",
      "beans", "chili", "cider", "flour", "guava", "kebab", "nacho", "ramen",
      "syrup", "spice", "broth", "fries", "berry", "lunch", "snack", "feast"
    ]
  },
  tech: {
    label: "Tech",
    words: [
      "pixel", "cache", "array", "debug", "linux", "mouse", "bytes", "logic",
      "robot", "cloud", "query", "stack", "queue", "react", "swift", "shell",
      "admin", "login", "input", "emoji", "macro", "modem", "patch", "proxy",
      "regex", "token", "virus", "email", "drone", "chips", "cable", "codec",
      "class", "float", "fetch", "merge", "parse", "route", "index", "crash",
      "build", "click", "cyber", "drive", "flash", "laser", "loops", "nodes"
    ]
  },
  movies: {
    label: "Movies",
    words: [
      "actor", "scene", "drama", "genre", "oscar", "movie", "award", "cameo",
      "frame", "stunt", "score", "props", "extra", "reels", "shoot", "ghost",
      "alien", "heist", "twist", "title", "flick", "debut", "anime", "indie",
      "rocky", "fargo", "plots", "trope", "lines", "comic", "stage", "light",
      "sound", "crowd", "tears", "laugh", "chase", "bravo", "stars", "films"
    ]
  },
  geography: {
    label: "Geography",
    words: [
      "coast", "delta", "ocean", "river", "beach", "cliff", "plain", "ridge",
      "marsh", "swamp", "dunes", "gorge", "globe", "north", "south", "earth",
      "atlas", "bayou", "canal", "fjord", "inlet", "islet", "oasis", "peaks",
      "polar", "shore", "woods", "cairo", "paris", "spain", "italy", "china",
      "india", "japan", "chile", "kenya", "egypt", "nepal", "texas", "tokyo",
      "miami", "delhi", "perth", "osaka", "congo", "niger", "andes", "lakes"
    ]
  }
};

for (const theme of Object.values(THEMES)) {
  if (theme.words) {
    theme.words = [...new Set(theme.words.filter((w) => /^[a-z]{5}$/.test(w)))];
  }
}
