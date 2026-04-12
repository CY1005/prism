FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 -i https://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com -r requirements.txt
COPY . ./api/
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8001"]
