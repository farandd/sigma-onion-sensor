import os
import gdown
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import io

# Konfigurasi - Disesuaikan dengan file ov5_VGG19.h5 di foldermu
MODEL_PATH = 'ov5_VGG19.h5'
# ID file dari link Google Drive (Gunakan ID yang valid jika file tidak di-push ke Git)
DRIVE_FILE_ID = '1egEAMzYI39e4dVaWbjGBKN0K4aKhyzmm'

def setup_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Model {MODEL_PATH} tidak ditemukan secara lokal. Sedang mengunduh dari Drive...")
        try:
            gdown.download(id=DRIVE_FILE_ID, output=MODEL_PATH, quiet=False)
            print("Download selesai!")
        except Exception as e:
            print(f"Gagal mengunduh dari Drive: {e}. Pastikan file {MODEL_PATH} ada di server.")
    
    print(f"Memuat model {MODEL_PATH}...")
    return load_model(MODEL_PATH, compile=False)

app = Flask(__name__)
CORS(app)

# Load model saat server pertama kali menyala
model = setup_model()
labels = ['Healthy', 'Moler', 'Purple blotch']

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file yang dikirim'}), 400
    
    try:
        file = request.files['file']
        in_memory_file = io.BytesIO(file.read())
        
        # Preprocessing Gambar
        img = image.load_img(in_memory_file, target_size=(224, 224))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Eksekusi Prediksi
        prediction = model.predict(img_array)
        
        # Logika Thresholding (mengurangi bias 'Healthy')
        probs = prediction[0]
        healthy_prob = probs[0]
        
        if healthy_prob < 0.70:
            probs_no_healthy = probs.copy()
            probs_no_healthy[0] = -1 
            result = labels[np.argmax(probs_no_healthy)]
        else:
            result = labels[np.argmax(probs)]
        
        return jsonify({
            'status': 'success',
            'result': result,
            'confidence_scores': {labels[i]: float(probs[i]) for i in range(len(labels))}
        })
        
    except Exception as e:
        return jsonify({'error': f'Gagal memproses prediksi: {str(e)}'}), 500

if __name__ == '__main__':
    # PERBAIKAN: Menggunakan port dinamis dari environment Railway
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
