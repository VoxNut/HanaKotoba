"""
Convert thekanjimap `data/composition.json` (component -> {in,out})
into a character -> [components] mapping JSON file suitable for
`manage.py import_kanjivg --file`.

Usage (from cmd.exe):
  python backend\scripts\convert_kanjimap_composition.py \
    --input "d:\\the-kanji-map\\data\\composition.json" \
    --output "d:\\the-kanji-map\\data\\composition_inverted.json"

The output will be a JSON object where each key is a kanji character and the
value is a list of component strings that appear in that kanji.
"""
import argparse
import json
from pathlib import Path


def invert_composition(input_path: Path, output_path: Path):
    data = json.loads(input_path.read_text(encoding="utf-8"))

    inverted: dict = {}

    # data format: { component: {"in": [...], "out": [...]}, ... }
    for comp, info in data.items():
        out_list = []
        if isinstance(info, dict):
            out_list = info.get("out") or []
        elif isinstance(info, list):
            # in some variants the file might directly map comp -> [kanji]
            out_list = info

        for ch in out_list:
            # ignore codes that are not single character kanji (but keep them if present)
            inverted.setdefault(ch, []).append(comp)

    # Optionally sort components for stability
    for k, comps in inverted.items():
        inverted[k] = sorted(list(dict.fromkeys(comps)))

    output_path.write_text(json.dumps(inverted, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(inverted)} entries to {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to composition.json")
    parser.add_argument("--output", required=True, help="Path to write inverted mapping")
    args = parser.parse_args()

    inp = Path(args.input)
    out = Path(args.output)
    if not inp.exists():
        raise SystemExit(f"Input file not found: {inp}")

    invert_composition(inp, out)


if __name__ == "__main__":
    main()
