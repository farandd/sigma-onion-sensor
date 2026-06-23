import os
import gdown
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import io

# Konfigurasi
MODEL_PATH = 'ov5_VGG16.h5'
# ID file dari link Google Drive: https://drive.google.com/file/d/1egEAMzYI39e4dVaWbjGBKN0K4aKhyzmm/view
DRIVE_FILE_ID = '1egEAMzYI39e4dVaWbjGBKN0K4aKhyzmm'

def setup_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Model {MODEL_PATH} tidak ditemukan. Sedang mengunduh dari Drive...")
        gdown.download(id=DRIVE_FILE_ID, output=MODEL_PATH, quiet=False)
        print("Download selesai!")
    return load_model(MODEL_PATH)

app = Flask(__name__)
CORS(app)

# Load model
model = setup_model()
labels = ['Healthy', 'Moler', 'Purple blotch']

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file'}), 400
    
    file = request.files['file']
    in_memory_file = io.BytesIO(file.read())
    
    # Preprocessing
    img = image.load_img(in_memory_file, target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Prediksi
    prediction = model.predict(img_array)
    
    # Logika Thresholding (untuk mengurangi bias 'Healthy')
    probs = prediction[0]
    healthy_prob = probs[0]
    
    if healthy_prob < 0.70:
        probs_no_healthy = probs.copy()
        probs_no_healthy[0] = -1 
        result = labels[np.argmax(probs_no_healthy)]
    else:
        result = labels[np.argmax(probs)]
    
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
