// Somriures - Riuada de nassos (#Riuadadenassos)
// Campaña solidaria a favor de Pallapupas.

// ---------- Ajustes fáciles de cambiar ----------
var ANCHO = 600;
var ALTO = 550;
var DURACION = 30;   // segundos de partida
var PROB = 0.06;     // más alto = caen más narices
var MENSAJE_FINAL = "Cada rialla compta! Ajuda els Pallapupas a seguir portant somriures als hospitals. Anima't a convertir els teus punts en somriures";
// Enllaç del botó "Apadrina": canvia-ho pel teu enllaç quan el tinguis
var ENLACE_APADRINAR = "https://www.stockcrowd.com/p2p/1799/Apadrinaunsomriure";

// ---------- Elementos de la página ----------
var cv = document.getElementById("cv");
var ctx = cv.getContext("2d");
var ov = document.getElementById("ov");
var btn = document.getElementById("btn");
var elScore = document.getElementById("score");
var elTime = document.getElementById("time");
var elResultat = document.getElementById("resultat");
var elApadrinar = document.getElementById("apadrinar");

// ---------- Estado del juego ----------
var noses = [];
var score = 0;
var time = DURACION;
var playing = false;
var last = 0;

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function actualizarMarcadores() {
  elScore.textContent = "Rialles: " + score;
  elTime.textContent = "Temps: " + Math.max(0, Math.ceil(time)) + "s";
}

function empezar() {
  noses = [];
  score = 0;
  time = DURACION;
  playing = true;
  last = performance.now();
  ov.hidden = true;
  elResultat.hidden = true;
  elApadrinar.hidden = true;
  actualizarMarcadores();
  requestAnimationFrame(bucle);
}

function terminar() {
  playing = false;
  document.getElementById("title").textContent = "Temps!";
  document.getElementById("msg").textContent = MENSAJE_FINAL;
  elResultat.textContent = "Has fet " + score + (score === 1 ? " rialla!" : " rialles!");
  elResultat.hidden = false;
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
      noses.splice(i, 1);
      score++;
      actualizarMarcadores();
      break;
    }
  }
});

btn.addEventListener("click", empezar);
dibujar();
