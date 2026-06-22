from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import io

app = Flask(__name__)
CORS(app) # Penting agar web bisa memanggil API ini

# Load model (pastikan nama file .h5 sesuai)
MODEL_PATH = 'ov5_VGG16.h5' 
model = load_model(MODEL_PATH)

# Sesuaikan urutan label dengan yang ada di training (0, 1, 2)
labels = ['Healthy', 'Moler', 'Purple blotch'] 

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'Tidak ada file'}), 400
    
    file = request.files['file']
    
    # KOREKSI: Baca file ke dalam BytesIO agar bisa dibaca oleh load_img
    in_memory_file = io.BytesIO(file.read())
    
    # Preprocessing gambar
    img = image.load_img(in_memory_file, target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Prediksi
    prediction = model.predict(img_array)
    
    # --- LOGIKA AMBANG BATAS UNTUK MENGURANGI BIAS 'HEALTHY' ---
    # Probabilitas: 0: Healthy, 1: Moler, 2: Purple blotch
    probs = prediction[0]
    healthy_prob = probs[0]
    
    # Jika probabilitas Healthy di bawah 70%, kita coba lihat kandidat lain
    if healthy_prob < 0.70:
        # Hapus probabilitas Healthy dari pertimbangan untuk melihat penyakit lain
        probs_no_healthy = probs.copy()
        probs_no_healthy[0] = -1 
        
        # Ambil label dari probabilitas tertinggi kedua
        result = labels[np.argmax(probs_no_healthy)]
        print(f"Hasil (Threshold Adjusted): {result} (Original Healthy Prob: {healthy_prob:.2f})")
    else:
        result = labels[np.argmax(probs)]
        print(f"Hasil (Default): {result} (Healthy Prob: {healthy_prob:.2f})")
    # -----------------------------------------------------------
    
    return jsonify({'result': result})

if __name__ == '__main__':
    # Jalankan di port 5000
    app.run(host='0.0.0.0', port=5000)
