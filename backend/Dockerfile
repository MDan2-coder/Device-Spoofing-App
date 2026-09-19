FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY main.py ./main.py
COPY sync_db.py ./sync_db.py
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic
COPY storage ./storage

EXPOSE 8000

CMD ["sh", "-c", "python sync_db.py && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2"]
