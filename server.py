#!/usr/bin/env python3
"""
Servidor de Somriures (#Riuadadenassos).

- Serveix els fitxers del joc (index.html, style.css, juego.js, logos.png...).
- Guarda i serveix la classificació (taula de posicions) en un fitxer ranking.json.

Només fa servir la llibreria estàndard de Python: no cal instal·lar res.

Ús (des de qualsevol carpeta):
    python3 server.py

Escolta a 127.0.0.1:8202 (el port 8202 es pot canviar amb la variable PORT).
Nginx fa de proxy cap a aquest port.

API:
    GET  /api/ranking  ->  {"ranking": [{"nom": "...", "punts": 80, ...}, ...]}
    POST /api/ranking  ->  cos JSON {"nom": "Anna", "punts": 80}
                           resposta {"ranking": [...], "posicio": 3}
"""

import json
import os
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# ---------- Ajustos fàcils de canviar ----------
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", 8202))
MOSTRAR = 7          # files que es mostren a la classificació
GUARDAR = 100        # puntuacions que es conserven al fitxer
MAX_PUNTS = 500      # puntuació màxima acceptada (evita valors absurds)
MAX_NOM = 12         # longitud màxima del nom

BASE = os.path.dirname(os.path.abspath(__file__))
FITXER = os.path.join(BASE, "ranking.json")
PRIVATS = {"server.py", "ranking.json", "ranking.json.tmp"}
bloqueig = threading.Lock()


def llegir():
    try:
        with open(FITXER, encoding="utf-8") as f:
            dades = json.load(f)
        return dades if isinstance(dades, list) else []
    except (FileNotFoundError, ValueError):
        return []


def escriure(llista):
    # Escriu en un fitxer temporal i el substitueix: evita deixar el fitxer a mitges.
    tmp = FITXER + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(llista, f, ensure_ascii=False)
    os.replace(tmp, FITXER)


def netejar_nom(nom):
    nom = "".join(c for c in str(nom) if c.isprintable() and c not in "<>")
    nom = " ".join(nom.split())[:MAX_NOM]
    return nom or "Anònim"


def es_privada(ruta):
    parts = [p for p in ruta.split("/") if p]
    return any(p.startswith(".") or p in PRIVATS for p in parts)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)

    def _json(self, codi, objecte):
        cos = json.dumps(objecte, ensure_ascii=False).encode("utf-8")
        self.send_response(codi)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(cos)

    def send_head(self):
        # No serveix el codi del servidor, les dades ni fitxers ocults (.git...)
        ruta = self.path.split("?", 1)[0]
        if es_privada(ruta):
            self.send_error(404)
            return None
        return super().send_head()

    def do_GET(self):
        ruta = self.path.split("?", 1)[0]
        if ruta == "/api/ranking":
            with bloqueig:
                llista = llegir()
            return self._json(200, {"ranking": llista[:MOSTRAR]})
        return super().do_GET()

    def do_POST(self):
        ruta = self.path.split("?", 1)[0]
        if ruta != "/api/ranking":
            return self._json(404, {"error": "no trobat"})
        try:
            llarg = int(self.headers.get("Content-Length", 0))
            if llarg <= 0 or llarg > 1024:
                raise ValueError("mida no vàlida")
            dades = json.loads(self.rfile.read(llarg).decode("utf-8"))
            punts = dades["punts"]
            if isinstance(punts, bool) or not isinstance(punts, int) or not 0 < punts <= MAX_PUNTS:
                raise ValueError("punts no vàlids")
            nom = netejar_nom(dades.get("nom", ""))
        except (ValueError, KeyError, TypeError, AttributeError, UnicodeDecodeError):
            return self._json(400, {"error": "dades no vàlides"})

        entrada = {"nom": nom, "punts": punts, "data": int(time.time())}
        with bloqueig:
            llista = llegir()
            llista.append(entrada)
            llista.sort(key=lambda e: (-e.get("punts", 0), e.get("data", 0)))
            posicio = next(i for i, e in enumerate(llista, 1) if e is entrada)
            llista = llista[:GUARDAR]
            escriure(llista)
        return self._json(200, {
            "ranking": llista[:MOSTRAR],
            "posicio": posicio if posicio <= GUARDAR else None,
        })


if __name__ == "__main__":
    servidor = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Somriures escoltant a http://%s:%d  (Ctrl+C per aturar)" % (HOST, PORT))
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
