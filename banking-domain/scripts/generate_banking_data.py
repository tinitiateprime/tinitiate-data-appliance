import csv
import json
import os
import pandas as pd
from banking_data_model import generate_records, RECORD_COUNT, CHUNK_SIZE

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
PARQUET_DIR = os.path.join(OUTPUT_DIR, "parquet")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PARQUET_DIR, exist_ok=True)

    records = generate_records(1, RECORD_COUNT)

    csv_path = os.path.join(OUTPUT_DIR, "banking_data.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)

    json_path = os.path.join(OUTPUT_DIR, "banking_data.json")
    with open(json_path, "w", encoding="utf-8") as jsonfile:
        json.dump(records, jsonfile, indent=2)

    xml_path = os.path.join(OUTPUT_DIR, "banking_data.xml")
    with open(xml_path, "w", encoding="utf-8") as xmlfile:
        xmlfile.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
        xmlfile.write("<BankingRecords>\n")
        for record in records:
            xmlfile.write("  <Record>\n")
            for key, value in record.items():
                xmlfile.write(f"    <{key}>{value}</{key}>\n")
            xmlfile.write("  </Record>\n")
        xmlfile.write("</BankingRecords>\n")

    df = pd.DataFrame(records)
    for chunk_index, start in enumerate(range(0, RECORD_COUNT, CHUNK_SIZE), start=1):
        chunk = df.iloc[start : start + CHUNK_SIZE]
        parquet_chunk_path = os.path.join(PARQUET_DIR, f"banking_data_part_{chunk_index:02d}.parquet")
        chunk.to_parquet(parquet_chunk_path, index=False)

    print("Generated files:")
    print(f"  {csv_path}")
    print(f"  {json_path}")
    print(f"  {xml_path}")
    print(f"  {PARQUET_DIR}/*.parquet")


if __name__ == "__main__":
    main()
