// Somriures - Riuada de nassos (#Riuadadenassos)
// Campaña solidaria a favor de Pallapupas.

// ---------- Ajustes fáciles de cambiar ----------
// Mida del joc: es llegeix del <canvas> de index.html (width i height),
// així no cal canviar-la també aquí.
var cv = document.getElementById("cv");
var ANCHO = cv.width;
var ALTO = cv.height;
cv.style.aspectRatio = ANCHO + " / " + ALTO;   // evita que els nassos es vegin ovalats
var DURACION = 30;   // segundos de partida
var PROB = 0.06;     // más alto = caen más narices
// Conversió de punts a euros: cada PUNTS_PER_EURO punts = 1 €.
// Sempre s'indiquen euros sencers (sense cèntims): 90 punts = 9 €, 95 punts = 9 €, 100 punts = 10 €.
var PUNTS_PER_EURO = 10;
var MENSAJE_FINAL = "Cada rialla compta! Ajuda els Pallapupas a seguir portant somriures als hospitals.";
// Punts segons la mida del nas (radi en píxels, entre 18 i 32). Com més petit, més punts.
// Es tria la primera fila on el radi sigui menor que "maxRadi".
var PUNTS_PER_MIDA = [
  { maxRadi: 23, punts: 3 },   // nassos petits
  { maxRadi: 28, punts: 2 },   // nassos mitjans
  { maxRadi: 999, punts: 1 }   // nassos grans
];
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

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function puntosDe(radio) {
  for (var i = 0; i < PUNTS_PER_MIDA.length; i++) {
    if (radio < PUNTS_PER_MIDA[i].maxRadi) return PUNTS_PER_MIDA[i].punts;
  }
  return 1;
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
  playing = true;
  last = performance.now();
  ov.hidden = true;
  elResultat.hidden = true;
  elPuntsFinal.hidden = true;
  elConversio.hidden = true;
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

  // Aparece una nariz nueva de vez en cuando
  if (Math.random() < PROB * dt * 33) {
    var r = 18 + Math.random() * 14;
    noses.push({
      x: r + Math.random() * (ANCHO - 2 * r),
      y: -r,
      r: r,
      v: 2 + Math.random() * 3
    });
  }

  // Mover las narices y quitar las que salen por abajo
  for (var i = noses.length - 1; i >= 0; i--) {
    noses[i].y += noses[i].v * dt * 33;
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
      var punts = puntosDe(n.r);
      noses.splice(i, 1);
      rialles++;
      score += punts;
      avisos.push({ x: n.x, y: n.y, texto: "+" + punts, vida: 0.7 });
      actualizarMarcadores();
      break;
    }
  }
});

btn.addEventListener("click", empezar);
dibujar();
