import kagglehub

# Download latest version
path = kagglehub.dataset_download("seyeon040768/car-detection-dataset")

print("Path to dataset files:", path)