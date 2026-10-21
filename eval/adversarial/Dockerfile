# Live FGSM/PGD API for Cloud Run. Express calls this; browsers never talk to it.
FROM python:3.12-slim

WORKDIR /app
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir \
        numpy fastapi uvicorn pydantic pillow \
        torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir torchattacks

COPY eval/adversarial /app
ENV PORT=8080
EXPOSE 8080
CMD ["python", "service.py"]
