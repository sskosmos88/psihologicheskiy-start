"""
Психологический старт — конверсионный дайджест для новичков.

Запуск: python app.py
Открой в браузере: http://127.0.0.1:5000
"""

import os

from flask import Flask, render_template, send_from_directory

app = Flask(__name__)


@app.route("/")
def index():
    """Главная (и единственная) страница сайта."""
    return render_template("index.html")


@app.route("/content.json")
def content():
    """Отдаём данные карточек (лежат рядом с app.py)."""
    return send_from_directory(os.path.dirname(__file__), "content.json")


if __name__ == "__main__":
    # debug=True — перезапуск при изменении файлов (для разработки)
    app.run(debug=True, host="127.0.0.1", port=5000)
