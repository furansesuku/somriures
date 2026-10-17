// Somriures - Riuada de nassos (#Riuadadenassos)
// Campaña solidaria a favor de Pallapupas.

// ---------- Ajustes fáciles de cambiar ----------
// Mida del joc: es llegeix del <canvas> de index.html (width i height),
// així no cal canviar-la també aquí.
var cv = document.getElementById("cv");
var ANCHO = cv.width;
var ALTO = cv.height;
cv.style.aspectRatio = ANCHO + " / " + ALTO;   // evita que els nassos es vegin ovalats
var DURACION = 45;   // segundos de partida (igual para todos)
var TEMPS_APARICIO = 42;   // les narius apareixen durant aquests segons; l'última té temps de caure
// Conversió de punts a euros: cada PUNTS_PER_EURO punts = 1 €.
// Sempre s'indiquen euros sencers (sense cèntims): 90 punts = 9 €, 95 punts = 9 €, 100 punts = 10 €.
var PUNTS_PER_EURO = 10;
var MENSAJE_FINAL = "Cada rialla compta! Ajuda els Pallapupas a seguir portant somriures als hospitals.";
// Cada partida té SEMPRE els mateixos nassos (sumen 300 punts exactes), en ordre aleatori.
// punts: valor del nas. quantitat: quants en surten per partida.
// radiMin/radiMax: mida (com més petit, més punts). vMin/vMax: velocitat de caiguda en píxels per segon.
// Per canviar la dificultat, toca les velocitats (vMin/vMax), sobretot les dels de +3.
var TIPUS_NASSOS = [
  { punts: 3, quantitat: 66, radiMin: 18, radiMax: 22.9, vMin: 230, vMax: 290 },   // petits i ràpids
  { punts: 2, quantitat: 39, radiMin: 23, radiMax: 27.9, vMin: 150, vMax: 190 },   // mitjans
  { punts: 1, quantitat: 24, radiMin: 28, radiMax: 32,   vMin: 100, vMax: 130 }    // grans i lents
];                                   // 66*3 + 39*2 + 24*1 = 300 punts
var MAX_RAPIDS_SEGUITS = 2;          // com a màxim 2 nassos de +3 seguits
var DIST_MIN_X = 110;                // distància horitzontal mínima respecte al nas anterior
// Enllaç del botó "Apadrina": canvia-ho pel teu enllaç quan el tinguis
var ENLACE_APADRINAR = "https://www.stockcrowd.com/p2p/1799/Apadrinaunsomriure";

// ---------- Elementos de la página ----------
var ctx = cv.getContext("2d");
var ov = document.getElementById("ov");
var btn = document.getElementById("btn");
var elRialles = document.getElementById("rialles");
var elScore = document.getElementById("score");
var elPuntsFinal = document.getElementById("resultatPunts");
var elConversio = document.getElementById("conversio");
var elTime = document.getElementById("time");
var elResultat = document.getElementById("resultat");
var elApadrinar = document.getElementById("apadrinar");

// ---------- Estado del juego ----------
var noses = [];
var avisos = [];   // textos "+N" que apareixen un moment en atrapar un nas
var rialles = 0;   // nombre de nassos atrapats
var score = 0;     // punts (segons la mida de cada nas)
var time = DURACION;
var playing = false;
var last = 0;
var cua = [];       // nassos de la partida, en ordre d'aparició
var horaris = [];   // segon de la partida en què surt cada nas
var seguent = 0;    // índex del proper nas que ha de sortir
var darreraX = -1000;

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Prepara la partida: llista de nassos (barrejada) i hora d'aparició de cadascun
function prepararPartida() {
  var maxPunts = TIPUS_NASSOS[0].punts;
  var llista = [];
  // Sorteja l'ordre: a cada posició s'escull un tipus a l'atzar (segons els que queden),
  // però mai més de MAX_RAPIDS_SEGUITS nassos de +3 seguits. Si no quadra, es torna a provar.
  for (var intent = 0; intent < 100; intent++) {
    var queden = TIPUS_NASSOS.map(function (t) { return t.quantitat; });
    var total = queden.reduce(function (x, y) { return x + y; }, 0);
    var seguits = 0;
    llista = [];
    var ok = true;
    while (total > 0) {
      var pes = queden.map(function (q, idx) {
        return (TIPUS_NASSOS[idx].punts === maxPunts && seguits >= MAX_RAPIDS_SEGUITS) ? 0 : q;
      });
      var suma = pes.reduce(function (x, y) { return x + y; }, 0);
      if (suma === 0) { ok = false; break; }
      var sorteig = Math.random() * suma, triat = 0;
      while (sorteig >= pes[triat]) { sorteig -= pes[triat]; triat++; }
      queden[triat]--; total--;
      llista.push(TIPUS_NASSOS[triat]);
      seguits = (TIPUS_NASSOS[triat].punts === maxPunts) ? seguits + 1 : 0;
    }
    if (ok) break;
  }
  cua = llista;
  // Aparicions repartides a intervals regulars, amb una mica de variació
  var interval = TEMPS_APARICIO / llista.length;
  horaris = [];
  for (var n = 0; n < llista.length; n++) {
    horaris.push((n + 0.5 + (Math.random() - 0.5) * 0.6) * interval);
  }
  seguent = 0;
  darreraX = -1000;
}

function crearNas(tipus) {
  var r = tipus.radiMin + Math.random() * (tipus.radiMax - tipus.radiMin);
  var x = 0;
  for (var intent = 0; intent < 10; intent++) {
    x = r + Math.random() * (ANCHO - 2 * r);
    if (Math.abs(x - darreraX) >= DIST_MIN_X) break;
  }
  darreraX = x;
  noses.push({
    x: x,
    y: -r,
    r: r,
    v: tipus.vMin + Math.random() * (tipus.vMax - tipus.vMin),   // px per segon
    punts: tipus.punts
  });
}

function actualizarMarcadores() {
  elRialles.textContent = "Rialles: " + rialles;
  elScore.textContent = "Punts: " + score;
  elTime.textContent = "Temps: " + Math.max(0, Math.ceil(time)) + "s";
}

function empezar() {
  noses = [];
  avisos = [];
  rialles = 0;
  score = 0;
  time = DURACION;
  prepararPartida();
  playing = true;
  last = performance.now();
  ov.hidden = true;
  elResultat.hidden = true;
  elPuntsFinal.hidden = true;
  elConversio.hidden = true;
  boxGuardar.hidden = true;
  estatRanking.hidden = true;
  elApadrinar.hidden = true;
  actualizarMarcadores();
  requestAnimationFrame(bucle);
}

function terminar() {
  playing = false;
  document.getElementById("title").textContent = "Temps!";
  document.getElementById("msg").textContent = MENSAJE_FINAL;
  var euros = Math.floor(score / PUNTS_PER_EURO);   // sempre euros sencers, arrodonit cap avall
  elResultat.textContent = "Has fet " + rialles + (rialles === 1 ? " rialla!" : " rialles!");
  elResultat.hidden = false;
  elPuntsFinal.textContent = "Has aconseguit " + score + (score === 1 ? " punt" : " punts");
  elPuntsFinal.hidden = false;
  if (euros >= 1) {
    elConversio.textContent = "Pots convertir els teus " + score + (score === 1 ? " punt" : " punts") +
      " en " + euros + " \u20ac de somriures al bot\u00f3 d'aqu\u00ed sota.";
  } else {
    elConversio.textContent = "Amb " + PUNTS_PER_EURO + " punts o m\u00e9s podr\u00e0s convertir-los en euros de somriures. Torna-ho a provar!";
  }
  elConversio.hidden = false;
  guardat = false;
  btnGuardar.disabled = false;
  estatRanking.hidden = true;
  if (score > 0) {
    inputNom.value = nomRecordat();
    boxGuardar.hidden = false;
  } else {
    boxGuardar.hidden = true;
  }
  cargarRanking(null);
  elApadrinar.href = ENLACE_APADRINAR;
  elApadrinar.hidden = false;
  btn.textContent = "Tornar a jugar";
  ov.hidden = false;
}

function bucle(t) {
  if (!playing) return;

  var dt = Math.min((t - last) / 1000, 0.1);
  last = t;
  time -= dt;

  if (time <= 0) {
    time = 0;
    actualizarMarcadores();
    dibujar();
    terminar();
    return;
  }

  // Surten els nassos segons l'horari de la partida
  var transcorregut = DURACION - time;
  while (seguent < cua.length && transcorregut >= horaris[seguent]) {
    crearNas(cua[seguent]);
    seguent++;
  }

  // Mover las narices y quitar las que salen por abajo
  for (var i = noses.length - 1; i >= 0; i--) {
    noses[i].y += noses[i].v * dt;
    if (noses[i].y - noses[i].r > ALTO) noses.splice(i, 1);
  }

  for (var k = avisos.length - 1; k >= 0; k--) {
    avisos[k].vida -= dt;
    avisos[k].y -= 30 * dt;
    if (avisos[k].vida <= 0) avisos.splice(k, 1);
  }

  actualizarMarcadores();
  dibujar();
  requestAnimationFrame(bucle);
}

function dibujar() {
  ctx.fillStyle = css("--field");
  ctx.fillRect(0, 0, ANCHO, ALTO);

  var rojo = css("--red");
  var oscuro = css("--red-dark");
  var brillo = css("--shine");

  noses.forEach(function (n) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = rojo;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = oscuro;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(n.x - n.r * 0.3, n.y - n.r * 0.4, n.r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = brillo;
    ctx.fill();
  });

  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  avisos.forEach(function (a) {
    ctx.globalAlpha = Math.max(0, Math.min(1, a.vida / 0.5));
    ctx.fillStyle = css("--fg");
    ctx.fillText(a.texto, a.x, a.y);
  });
  ctx.globalAlpha = 1;
}

// Clic o toque sobre una nariz
cv.addEventListener("pointerdown", function (e) {
  if (!playing) return;
  var rect = cv.getBoundingClientRect();
  var x = (e.clientX - rect.left) * ANCHO / rect.width;
  var y = (e.clientY - rect.top) * ALTO / rect.height;

  for (var i = noses.length - 1; i >= 0; i--) {
    var n = noses[i];
    var dx = x - n.x;
    var dy = y - n.y;
    if (dx * dx + dy * dy <= (n.r + 6) * (n.r + 6)) {
      var punts = n.punts;
      noses.splice(i, 1);
      rialles++;
      score += punts;
      avisos.push({ x: n.x, y: n.y, texto: "+" + punts, vida: 0.7 });
      actualizarMarcadores();
      break;
    }
  }
});

// ---------- Classificació (taula de posicions) ----------
// El servidor (server.py) guarda la classificació; aquí només es demana i es mostra.
var URL_RANKING = "api/ranking";   // relatiu a la pàgina: .../festeve/somriures/api/ranking
var FILES_RANKING = 7;
var cosRanking = document.getElementById("cosRanking");
var notaRanking = document.getElementById("notaRanking");
var boxGuardar = document.getElementById("guardar");
var inputNom = document.getElementById("nom");
var btnGuardar = document.getElementById("btnGuardar");
var estatRanking = document.getElementById("estatRanking");
var guardat = false;

function nomRecordat() {
  try { return localStorage.getItem("somriures_nom") || ""; } catch (e) { return ""; }
}

function pintarRanking(llista, destacada) {
  cosRanking.textContent = "";
  for (var i = 0; i < FILES_RANKING; i++) {
    var e = llista && llista[i];
    var tr = document.createElement("tr");
    if (destacada === i + 1) tr.className = "meva";
    var tdPos = document.createElement("td");
    var tdNom = document.createElement("td");
    var tdPunts = document.createElement("td");
    tdPos.textContent = i + 1;
    tdNom.textContent = e ? e.nom : "\u2014";     // textContent: el nom mai s'interpreta com a HTML
    tdPunts.textContent = e ? e.punts : "";
    tdPunts.className = "punts";
    tr.appendChild(tdPos); tr.appendChild(tdNom); tr.appendChild(tdPunts);
    cosRanking.appendChild(tr);
  }
}

function cargarRanking(destacada) {
  fetch(URL_RANKING, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      pintarRanking(d.ranking, destacada);
      notaRanking.hidden = true;
    })
    .catch(function () {
      notaRanking.textContent = "No s'ha pogut carregar la classificaci\u00f3.";
      notaRanking.hidden = false;
    });
}

function guardarPuntuacio() {
  if (guardat || score <= 0) return;
  var nom = inputNom.value.trim();
  guardat = true;
  btnGuardar.disabled = true;
  try { localStorage.setItem("somriures_nom", nom); } catch (e) {}

  fetch(URL_RANKING, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom: nom, punts: score })
  })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      pintarRanking(d.ranking, d.posicio);
      notaRanking.hidden = true;
      boxGuardar.hidden = true;
      if (!d.posicio) {
        estatRanking.textContent = "Puntuaci\u00f3 desada!";
      } else if (d.posicio <= FILES_RANKING) {
        estatRanking.textContent = "Puntuaci\u00f3 desada! Ets el n\u00famero " + d.posicio + ".";
      } else {
        estatRanking.textContent = "Puntuaci\u00f3 desada! Has quedat a la posici\u00f3 " + d.posicio + ".";
      }
      estatRanking.hidden = false;
      document.getElementById("rankingSec").scrollIntoView({ behavior: "smooth", block: "nearest" });
    })
    .catch(function () {
      guardat = false;
      btnGuardar.disabled = false;
      estatRanking.textContent = "No s'ha pogut desar. Torna-ho a provar.";
      estatRanking.hidden = false;
    });
}

btnGuardar.addEventListener("click", guardarPuntuacio);
inputNom.addEventListener("keydown", function (e) {
  if (e.key === "Enter") guardarPuntuacio();
});

btn.addEventListener("click", empezar);
dibujar();
pintarRanking([], null);
cargarRanking(null);
