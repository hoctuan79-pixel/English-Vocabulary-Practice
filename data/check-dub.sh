#!/bin/bash

FILE="filtered_vocab.json"

duplicates=$(jq -r '.vocabularies[].word' "$FILE" \
| tr '[:upper:]' '[:lower:]' \
| sed 's/^ *//;s/ *$//' \
| sort \
| uniq -d)

for word in $duplicates; do
  echo "==== Duplicate: $word ===="

  jq --arg w "$word" '
    .vocabularies[]
    | select(.word | ascii_downcase == $w)
  ' "$FILE"

  echo
done