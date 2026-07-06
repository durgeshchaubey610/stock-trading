from pathlib import Path


csv_path = Path(__file__).resolve().parent / "ind_nifty500list (2).csv"
nifty500 = []

with csv_path.open(encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]

header = [column.strip() for column in lines[0].split(",")]
symbol_index = header.index("Symbol")

for line in lines[1:]:
    row = [column.strip() for column in line.split(",")]
    if len(row) <= symbol_index:
        continue

    symbol = row[symbol_index]
    if symbol:
        nifty500.append(f"{symbol}.NS")

print(f"Loaded {len(nifty500)} symbols from {csv_path.name}")
print("nifty500 = [")
for symbol in nifty500:
    print(f'    "{symbol}",')
print("]")
