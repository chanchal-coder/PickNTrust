import re
import sys
from pathlib import Path

def rewrite_file(path_str: str) -> None:
    p = Path(path_str)
    s = p.read_text(encoding="utf-8")
    # Strictly require is_featured = 1 (remove truthy forms)
    s = s.replace("is_featured = 1 OR", "is_featured = 1")
    s = re.sub(r".*CAST\(is_featured AS TEXT\).*\n", "", s)
    s = re.sub(r".*COALESCE\(is_featured,\s*0\)\s*=\s*1.*\n", "", s)
    # Remove Top Picks fallback block that broadens criteria
    s = re.sub(r"(?s)\n\s*//\s*Fallback:.*?\n\s*\}", "\n", s)
    p.write_text(s, encoding="utf-8")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python rewrite_top_picks.py <routes.js>")
        sys.exit(1)
    rewrite_file(sys.argv[1])