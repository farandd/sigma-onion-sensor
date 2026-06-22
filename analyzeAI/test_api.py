import requests

# Pastikan ada satu gambar bawang di folder analyzeAI untuk dites
# Ganti 'contoh_bawang.jpg' dengan nama file gambar yang ada di folder Anda
url = 'http://localhost:5000/predict'
files = {'file': open('Training_ov5/healthy/07-07-2024_15-29-00.jpeg', 'rb')} 

response = requests.post(url, files=files)
print(response.json())