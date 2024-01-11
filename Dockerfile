FROM python:3.11.7-slim-bookworm

WORKDIR /project

COPY . /project

RUN pip install --no-cache-dir --upgrade -r /project/hivelab-web/requirements.txt

EXPOSE 80

ENTRYPOINT ["python"]

CMD ["main.py"]