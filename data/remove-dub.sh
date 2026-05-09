#!/bin/bash

FILE="vocab.json"
OUTPUT="filtered_vocab.json"

jq '
{
  vocabularies:
    (
      .vocabularies
      | unique_by(.word | ascii_downcase)
    )
}
' "$FILE" > "$OUTPUT"

echo "Đã loại bỏ duplicate."
echo "File kết quả: $OUTPUT"