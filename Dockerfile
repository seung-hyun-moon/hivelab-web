FROM python:3.11.7

WORKDIR /project

COPY . /project

RUN pip install --no-cache-dir --upgrade -r ./requirements.txt

EXPOSE 80

ENTRYPOINT [ "python" ]

CMD ["main.py"]