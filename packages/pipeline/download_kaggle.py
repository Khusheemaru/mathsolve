import kagglehub
import sys

# Download latest version of the dataset
path = kagglehub.dataset_download("awsaf49/math-dataset")

# Print just the path so Node.js can read it
print(path)
