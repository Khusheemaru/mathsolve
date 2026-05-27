from datasets import load_dataset
import json
import sys

# Load the dataset
ds = load_dataset("qwedsacf/competition_math")
train = ds['train']

print(f"Train size: {len(train)}")

print("First train item:")
print(train[0])

# Export all to a single JSON list
print("Exporting to JSON...")
all_data = []

# To avoid memory issues, we can just dump directly
# but list of dicts is fine for 12,500 items.

for item in train:
    item['split'] = 'train'
    all_data.append(item)
    
with open("hf_math_dump.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f)

print(f"Exported {len(all_data)} items to hf_math_dump.json")
