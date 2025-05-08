import requests

API_URL = "https://api-inference.huggingface.co/models/YOUR_USERNAME/food-classifier"
headers = {"Authorization": "Bearer YOUR_HF_TOKEN"}

def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers=headers, data=data)
    return response.json()

output = query("image.jpg")