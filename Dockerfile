# 从仓库根目录部署 Railway 时使用（Root Directory 留空或设为 /）
# 更推荐：Railway 服务 Settings → Root Directory = backend
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --default-timeout=180 --retries 3 -r requirements.txt

COPY backend/app ./app
COPY backend/run.py ./run.py

RUN mkdir -p /app/data

ENV PYTHONUNBUFFERED=1
ENV RUN_SYNC_ON_STARTUP=false

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
