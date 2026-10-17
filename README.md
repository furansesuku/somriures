# Somriures · Riuada de nassos

Joc solidari de la campanya **#Riuadadenassos** a favor dels **Pallapupas** (pallassos d'hospital).
Cauen nassos vermells per la pantalla: cal atrapar-ne tants com es pugui en 45 segons.
En acabar, el joc proposa convertir els punts en euros i porta a la pàgina d'aportació de la campanya.

## Com es juga

- Fes clic (o toca amb el dit) als nassos abans que arribin a baix.
- **Rialles** = nombre de nassos atrapats.
- **Punts** = els nassos petits valen més: 3 punts (petits i ràpids), 2 (mitjans), 1 (grans i lents).
- Cada partida surten sempre 129 nassos (66 de +3, 39 de +2 i 24 de +1) en ordre aleatori: el màxim possible és sempre **300 punts**.
- En acabar, el joc mostra els punts i els euros equivalents: **10 punts = 1 €**, sempre en euros sencers
  (arrodonit cap avall: 90 punts = 9 €, 95 punts = 9 €, 100 punts = 10 €).
- Es pot desar el nom a la **classificació** (posicions de l'1 al 7).

## Fitxers del projecte

| Fitxer | Què fa |
|---|---|
| `index.html` | Estructura de la pàgina: marcador, joc, classificació i logo |
| `style.css` | Aspecte (colors, mides, mode clar/fosc, adaptació a mòbil i ordinador) |
| `juego.js` | Lògica del joc: nassos, punts, conversió a euros, classificació |
| `server.py` | Servidor Python: serveix el joc i guarda la classificació |
| `logos.png` | Logos de la campanya (#Riuadadenassos i Pallapupas) |
| `ranking.json` | Dades de la classificació (el crea `server.py` automàticament) |

## Posada en marxa

Requisit: Python 3 (no cal instal·lar res més).

```bash
cd /var/www/festeve/somriures
nohup python3 server.py > somriures.log 2>&1 &
curl http://127.0.0.1:8202/api/ranking      # ha de respondre {"ranking": []}
```

El servidor escolta al port **8202** (només en local). Nginx fa de proxy des de
`/festeve/somriures/` (bloc `location` a `/etc/nginx/snippets/festeve/festeve.conf`):

```nginx
location /festeve/somriures/ {
    proxy_pass http://127.0.0.1:8202/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /festeve/somriures;
}
```

Després de canviar nginx: `sudo nginx -t && sudo systemctl reload nginx`.
La pàgina s'obre a `https://EL-TEU-DOMINI/festeve/somriures/` (amb la barra final).

Per aturar el servidor: `pkill -f "server.py"`.

## Què es pot ajustar

**`juego.js`** (al principi del fitxer):
- `DURACION`: segons de la partida (45) i `TEMPS_APARICIO`: durant quants segons surten nassos (42).
- `TIPUS_NASSOS`: quants nassos de cada valor (+1, +2, +3), la seva mida i la seva velocitat de caiguda (px/s). Aquí es toca la dificultat.
- `PUNTS_PER_EURO`: punts necessaris per cada euro (10).
- `ENLACE_APADRINAR`: enllaç del botó "Apadrina un somriure".
- `MENSAJE_FINAL`: missatge de la pantalla final.

**`index.html`**: la mida del joc és el `width`/`height` del `<canvas>` (600×800). El JavaScript la llegeix d'aquí.

**`style.css`**: colors (bloc `:root`) i mida màxima del logo (`.logos`).

**`server.py`**: `MOSTRAR` (files de la taula, 7), `MAX_PUNTS` (500), `MAX_NOM` (12), `PORT` (8202).

## Resum de les modificacions

1. **Primera versió en Python (`tkinter`).** El joc va començar com un script d'escriptori
   (`riuada_de_nassos.py`). Funciona en local, però no es pot mostrar en una web, perquè el
   navegador només executa JavaScript.
2. **Versió web (HTML + JavaScript).** El mateix joc es va reescriure per al navegador: funciona amb
   ratolí i amb el dit, i s'adapta al mode clar i fosc.
3. **Projecte "Somriures".** El joc es va separar en tres fitxers (`index.html`, `style.css`,
   `juego.js`) i es va canviar el nom de Sonrisas a **Somriures**.
4. **Desplegament.** El projecte es va pujar a GitHub i al servidor (VSH1), i s'hi va accedir per
   nginx amb un `location` que fa proxy al port 8202.
5. **Pantalla final i botó d'aportació.** En acabar es mostren les rialles i apareix el botó
   **"Apadrina un somriure"**, que obre la pàgina de la campanya a StockCrowd en una pestanya nova.
   Més tard el botó es va col·locar abans de "Tornar a jugar".
6. **Logo de la campanya.** S'hi va afegir la imatge amb els logos. Primer a dalt i, després, més
   petita i retallada a sota del joc, perquè no molestés.
7. **Punts segons la mida dels nassos.** Els nassos petits valen 3 punts, els mitjans 2 i els grans 1.
   En atrapar un nas apareix un "+N" que s'esvaeix.
8. **Rialles, punts i euros.** Es van separar els dos comptadors (rialles = nassos, punts = suma) i
   es va afegir la conversió a euros sencers (10 punts = 1 €), amb el missatge final
   "Pots convertir els teus X punts en Y € de somriures al botó d'aquí sota".
9. **Mida i aspecte del joc** (la modificació amb més proves):
   - La pantalla de joc es va fer més alta (600×800) perquè hi càpiga tota la informació final.
   - Els nassos es veien ovalats perquè la proporció del canvas no coincidia amb la del CSS;
     ara el JavaScript llegeix la mida del propi canvas i fixa la proporció.
   - Al mòbil la pantalla final no es retalla (el contingut es desplaça si no hi cap).
   - A l'ordinador, el joc s'adapta a l'alçada de la finestra per veure's sencer.
10. **Memòria cau del navegador.** Algunes còpies antigues del CSS i del JS es quedaven guardades al
    mòbil. Per això `index.html` carrega els fitxers amb un número de versió (`style.css?v=10`,
    `juego.js?v=10`): cada cop que es canviï algun fitxer, cal pujar aquest número.
11. **Classificació (la modificació més gran).** `python -m http.server` només serveix fitxers i no
    pot desar dades, així que s'ha creat `server.py`, que el substitueix:
    - Serveix el joc igual que abans i afegeix una API (`GET` i `POST` a `/api/ranking`).
    - Guarda les puntuacions a `ranking.json` (les 100 millors) i en mostra les 7 primeres.
    - El joc demana el nom en acabar la partida, el desa i ressalta la posició aconseguida.
    - No serveix `server.py`, `ranking.json` ni fitxers ocults (com `.git`).

12. **Puntuació màxima fixa (300) i partida de 45 s.** Cada partida té el mateix repartiment de nassos
    (66 de +3, 39 de +2, 24 de +1) en ordre aleatori, així que qui els atrapa tots sempre fa 300.
    Surten uns 3 nassos per segon; els de +3 cauen més ràpid i no en poden sortir més de 2 seguits.

## Limitacions conegudes

- **La classificació no és a prova de trampes.** Algú amb coneixements podria enviar puntuacions
  falses. El servidor limita les puntuacions a 500 i rebutja dades invàlides, però és un joc de
  diversió, no un sistema segur.
- **Els noms són lliures.** Si apareix un nom inadequat, s'esborra l'entrada de `ranking.json`; el
  servidor el torna a llegir a cada petició, sense reiniciar.
- **No es controlen les escriptures simultànies de manera estricta**, tot i que el servidor les
  ordena i evita deixar el fitxer a mitges.
- **El servidor s'ha de tornar a arrencar a mà** si es reinicia la màquina (es pot crear un servei
  `systemd` perquè s'engegui sol).
- El botó d'aportació porta a la pàgina general de la campanya: no s'ha trobat cap manera segura de
  precarregar l'import a StockCrowd, així que l'import el decideix la persona.
