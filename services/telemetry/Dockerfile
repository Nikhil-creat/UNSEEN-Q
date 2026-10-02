FROM python:3.12-slim
RUN pip install --no-cache-dir nats-py
COPY consumer.py /consumer.py
USER nobody
CMD ["python","/consumer.py"]
