FROM python:3.10-slim

WORKDIR /app

# Install dependensi sistem dasar
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dan install requirements terlebih dahulu (manfaatkan cache Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh file dari folder analyzeAI ke dalam container
COPY . .

# Expose port standar (Railway akan mendeteksi port dinamis lewat code app.py)
EXPOSE 5000

# Command untuk menjalankan aplikasi
CMD ["python", "app.py"]