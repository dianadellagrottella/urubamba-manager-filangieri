
import { useEffect, useMemo, useRef, useState } from "react";
// import { supabase } from "./supabase.js";
import "./App.css";

const STORAGE_KEY = "urubamba-manager-complete-v42-bella-completa";
const REMOTE_ROW_ID = "urubamba-main";
const LOCAL_MANAGER_EMAIL = "diana.dellagrottella@icloud.com";
const LOCAL_MANAGER_PASSWORD = "Urubamba123!";
const LOCAL_STAFF_EMAIL = "dianadellagrottella10@gmail.com";
const LOCAL_STAFF_PASSWORD = "Urubamba123!";

const managerMenu = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "notifiche", label: "Notifiche", icon: "🔔" },
  { key: "report", label: "Report automatico", icon: "🧾" },
  { key: "preordine", label: "Pre-Ordine", icon: "📦" },
  { key: "staff", label: "Staff", icon: "👥" },
  { key: "turni", label: "Turni", icon: "🗓️" },
  { key: "mance", label: "Mance", icon: "💰" },
  { key: "haccp", label: "HACCP", icon: "🧾" },
  { key: "storia", label: "Storia", icon: "📖" },
  { key: "schede", label: "Schede piatti", icon: "🍽️" },
  { key: "guest", label: "Guest notes", icon: "⭐" },
  { key: "inventario", label: "Inventario vini", icon: "🍷" },
  { key: "magazzinoCucina", label: "Magazzino cucina", icon: "🧊" },
  { key: "magazzinoDetergenti", label: "Magazzino detergenti", icon: "🧼" },
  { key: "ordini", label: "Ordini", icon: "🚚" },
  { key: "beverage", label: "Beverage", icon: "🍷" },
  { key: "foodcost", label: "Food cost", icon: "🧮" },
  { key: "drinkcost", label: "Drink cost", icon: "🍸" },
  { key: "diario", label: "Diario servizio", icon: "📝" },
  { key: "performance", label: "Performance staff", icon: "📈" },
  { key: "impostazioni", label: "Impostazioni", icon: "⚙️" },
];

const staffMenu = [
  { key: "turni", label: "Turni", icon: "🗓️" },
  { key: "attivita", label: "Attività", icon: "✅" },
  { key: "haccp", label: "HACCP", icon: "🧾" },
  { key: "schede", label: "Schede piatti", icon: "🍽️" },
  { key: "guest", label: "Guest notes", icon: "⭐" },
];

const turniCols = [
  { key: "lunCena", label1: "Lunedì", label2: "Cena" },
  { key: "marCena", label1: "Martedì", label2: "Cena" },
  { key: "merCena", label1: "Mercoledì", label2: "Cena" },
  { key: "gioCena", label1: "Giovedì", label2: "Cena" },
  { key: "venCena", label1: "Venerdì", label2: "Cena" },
  { key: "sabPra", label1: "Sabato", label2: "Pra" },
  { key: "sabCena", label1: "Sabato", label2: "Cena" },
  { key: "domPra", label1: "Domenica", label2: "Pra" },
  { key: "domCena", label1: "Domenica", label2: "Cena" },
];

const symbols = ["", "X", "Off", "F", "L"];

function uid() {
  return Date.now() + Math.floor(Math.random() * 100000);
}
function safeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function euro(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}
function calcIngredientCost(grams, costKg) {
  return (safeNum(grams) / 1000) * safeNum(costKg);
}
function getPresenti(rows, turnoKey) {
  return rows.filter((row) => row[turnoKey] === "X" || row[turnoKey] === "L");
}
function getTurnoLabel(turnoKey) {
  const found = turniCols.find((col) => col.key === turnoKey);
  return found ? `${found.label1} ${found.label2}` : turnoKey;
}
function getInventoryStatus(item) {
  const q = safeNum(item.quantita);
  const s = safeNum(item.soglia);
  if (q <= 0) return "Esaurito";
  if (q < s) return "Sottoscorta";
  if (q === s) return "Bassa";
  return "OK";
}
function getSuggestedOrderQty(item) {
  const q = safeNum(item.quantita);
  const s = safeNum(item.soglia);
  if (q <= 0) return Math.max(s * 2, 1);
  if (q < s) return Math.max(s * 2 - q, 1);
  if (q === s) return Math.max(s, 1);
  return 0;
}
function normalizeLabel(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function labelsMatch(a, b) {
  const aa = normalizeLabel(a);
  const bb = normalizeLabel(b);
  return aa === bb || aa.includes(bb) || bb.includes(aa);
}
function getPresenceWeight(symbol) {
  if (symbol === "L") return 2;
  if (symbol === "X") return 1;
  return 0;
}

const fullSchede = [
  ["Edamame Nikkei","Edamame piastrate poi ripassate con soia, salsa aburi, chimichurri, peperoni peruviani e polvere di pollo.","Servire con ciotolina piccola bianca a persona e salviette Urubamba."],
  ["Croquettas de cangrejo","Crocchette di granchio su crema al coriandolo.","Servire con forchetta."],
  ["Tacos Tonno","Sfoglia di mais croccante, tartare di tonno, guacamole no spicy, crema di peperoni peruviani, quinoa tostata.","Sempre serviti con la salvietta imbevuta."],
  ["Tacos Cangrejo","Sfoglia di mais croccante, tartare di granchio, guacamole no spicy, crema di peperoni peruviani, quinoa tostata.","Sempre serviti con la salvietta imbevuta."],
  ["Tacos Salmone","Sfoglia di mais croccante, tartare di salmone, guacamole no spicy, crema di peperoni peruviani, quinoa tostata.","Sempre serviti con la salvietta imbevuta."],
  ["Mushipan","Sandwich al vapore con choclo, miso yuzu, tartare di tonno, mayo al wasabi.","Da mangiare con le mani, forchetta di cortesia."],
  ["Temaki Otoro / Wagyu","Alga nori, shiso, riso, tartare di otoro o wagyu, caviale di storione bianco. Piatto molto importante della cucina giapponese.","Servire nel piatto a forma di mano, due pezzi. Consigliare di prenderlo con le mani e chiuderlo a cono."],
  ["Tataki di ventresca","Ventresca di tonno scottata, crema di soia al whisky, croccante di wasabi, affumicatura al legno di faggio.","Servizio elegante, spiegare affumicatura e parte pregiata del tonno."],
  ["Tiradito de atun / otoro","Sashimi di otoro o tonno su salsa ponzu e caviale.","Mise en place alzatina."],
  ["Inkaponzu","Seppia caramellata in salsa ponzu, maionese al coriandolo, chulpi tostato.","Presentare come piatto caldo-freddo con nota agrumata."],
  ["Causa de langostino","Spuma di patata viola, cestinetto di yuca, tartare di aragosta cotta, quinoa tostata, oro edibile, crema di avocado, polvere di cocco.","Mise en place cucchiaio."],
  ["Causa Nikkei","Spuma di patate fredda, tartare di tonno, tartare di granchio, uova di quaglia, guacamole, salsa acevichado, quinoa.","Servire con forchetta e dire di mischiare tutti gli ingredienti prima di mangiare."],
  ["Anticucho","Spiedini di picanha, choclo, camote in tempura, crema di peperoni peruviana, salsa huacatay.","Servire con forchetta e coltello."],
  ["Maca bun","Bun a base di farina di maca con maialino cotto a bassa temperatura e cipolla caramellata.","Servizio informale ma spiegazione ingredienti obbligatoria."],
  ["Bao Nikkei","Bao a base di farina di riso, hamburger di gamberi o black angus, uova di quaglia, yuca, maionese al coriandolo.","Presentare come street food gourmet."],
  ["Lollipop shrimps","Chupa chups di gamberi in salsa agrodolce, pasta kataifi, crema di peperoni peruviani e sesamo.","Porgere ogni lollipop all'ospite e suggerire di intingerlo nella crema."],
  ["Capasanta Nikkei","Capasanta in doppia cottura con salsa aburi e zest di lime.","Avvisare che il guscio è caldo, mangiare la capasanta e bere il sughetto."],
  ["Gyoza Nikkei","Ravioli al vapore ripieni di gamberi su crema goma creamy, quinoa tostata e chips, granella di peperoni peruviani.","Spiegare la crema di sesamo giapponese."],
  ["Creamy avocado","Guacamole pestato al momento, crema di aji amarillo, chulpi tostato, coriandolo, chips di ceci a parte.","Servire come condivisione."],
  ["Pisco lobster","Astice in tempura emulsionata al pisco, gel di alkekengi, quinoa e pistacchi.","Spiegare che il pisco è il distillato peruviano."],
  ["Ceviche Classica","Tartare di spigola marinata in leche de tigre, chulpi, choclo e camote.","Sempre servita con piattino ceviche e forchettina."],
  ["Ceviche Mezclado","Tartare di spigola, polpo e salmone marinata in leche de tigre con chulpi, choclo e camote.","Sempre servita con piattino ceviche e forchettina."],
  ["Ceviche Nikkei","Tartare di tonno, leche de tigre e soia, sesamo, avocado, alga nori e pistilli di peperoncino.","Sempre servita con piattino ceviche e forchettina."],
  ["Ceviche a la brasa","Gambero, scampo, polpo, capasanta e seppia su guazzetto di leche de tigre e tamarillo, pesto al coriandolo e quinoa.","Mise en place forchetta, coltello e cucchiaio. Spiegare che è totalmente cotta e affumicata all'arancia."],
  ["Tiradito Mezclado","Mix di carpacci: gambero di Mazara, scampi, polpo, salmone, spigola, leche de tigre e soia, quinoa e peperoni peruviani.","Presentazione molto ricca, stile crudo premium."],
  ["Tartare Ricciola","Ricciola, crumble di aji amarillo, tamarillo, chicha morada.","Se in comanda ci sono due tartare, mise en place alzatina con ciotolina di leche de tigre al mango."],
  ["Tartare Tonno","Tonno e quinoa.","Se in comanda ci sono due tartare, mise en place alzatina con ciotolina di leche de tigre al mango."],
  ["Tartare Salmone","Salmone e avocado.","Se in comanda ci sono due tartare, mise en place alzatina con ciotolina di leche de tigre al mango."],
  ["Sashimi Urubamba","Gambero di Mazara, scampi, tonno, salmone, polpo, capasanta, ricciola, con ciotolina di leche de tigre.","Spiegare che sotto al sashimi ci sono cetrioli."],
  ["Gamberi e caviale","Gamberi crudi su crema anticuchero con caviale di storione bianco.","Mise en place forchetta e coltello, con alzatina al tavolo."],
  ["Sashimi del giorno","Ultimamente orata intera, carpaccio con zest di yuzu e pre marinatura in ponzu.","Consigliare di intingere il pescato in ponzu oppure sale Maldon e olio, non tutto insieme."],
  ["Parilla di scampi","Scampi al forno con salsa olandese, quinoa tostata e peperoni peruviani.","Mise en place forchetta e coltello."],
  ["Nigiri","Tonno, salmone con yuzu, spigola, gambero rosso, wagyu, ventresca, ricciola con caviale. Alla base c'è wasabi.","Spiegare sempre la presenza del wasabi sotto il pesce."],
  ["Roll Acevichado","Tonno, crema di acevichado, gambero in tempura e avocado.","Si consiglia di intingere in soia."],
  ["Trufa maki","Salmone fuori, tonno dentro e tartufo nero.","Si consiglia di intingere in soia."],
  ["Maki Waranashi","Salmone, avocado e foie gras.","Si consiglia di intingere in soia."],
  ["Atun Nikkei Roll","Tonno scottato, guacamole, pasta kataifi, gambero in tempura e asparago.","Si consiglia di intingere in soia."],
  ["Rocoto Roll","Salmone, avocado furai e goma creamy.","Si consiglia di intingere in soia."],
  ["Veggy maki","Roll vegetariano creato dallo chef.","Presentare come opzione vegetariana premium."],
  ["Smoked salmon roll","Salmone scottato, salsa teriyaki, gambero in tempura e avocado.","Si consiglia di intingere in soia."],
  ["Ebitoro Special","Tartare di ventresca, gambero rosso di Mazara, caviale di storione bianco, asparago in tempura, chiodi di gamberi.","Signature roll."],
  ["Hamachi roll","Farcia di gambero e salmone crudo, sopra tartare di hamachi con miso e yuzu.","Signature roll."],
  ["Wagyu roll","Tripla consistenza di wagyu: tempura, tartare e flambé con caviale di storione bianco.","Signature roll."],
  ["Lobster roll","Astice in tre consistenze: tempura, flambé e riduzione al pisco.","Signature roll."],
  ["Scallop roll","Tartare di salmone e tonno, tempura di shiso, capasanta flambé al burro di Normandia, umeboshi e caviale.","Signature roll."],
  ["Cau cau de atun","Tonno tataki in crosta di quinoa su crema di sedano, patate e menta.","Sempre servito con forchetta e coltello."],
  ["Lomo saltado","Straccetti di picanha, tortino di riso bianco e verdure, patatine, cipolla.","Servire con forchetta e coltello e dire di mischiare tutti gli ingredienti."],
  ["Kakuni Nikkei","Maialino caramellato, crema di cavolfiore, olio allo scalogno e daikon marinato.","Servire con forchetta e coltello."],
  ["Soba de tigre","Pasta ramen fresca, leche de tigre caldo, scampi crudi e tartufo nero.","Sempre servito con forchetta."],
  ["Tagliata di wagyu","Servita con verdure di stagione o patatine, scalogno caramellato, salsa ponzu al wasabi.","Mise en place forchetta e coltello."],
  ["Paella Nikkei","Base di paella valenciana con choclo, scampi, calamari, salmone, tonno, gamberi, polpo, spigola, bisque d'astice e lime.","Sempre servita con forchetta e coltello, cucchiaio nel piatto per dividere la paella."],
  ["Hamachi teriyaki","Trancio di ricciola giapponese in padella, marinata in soia e mirin, con verdure marinate bollite.","Mise en place forchetta e coltello."],
  ["Parilla di carabineros","Gambero rosso dell'Atlantico al forno accompagnato da chips di gamberi.","Mise en place forchetta e coltello."],
  ["King crab","Re dei crostacei della Norvegia, al forno con burro e mirin, quinoa tostata crunchy.","Mise en place forchetta e coltello."],
  ["Caricia de mango","Semisfera di cioccolato bianco, cuore di mango, crumble mango cocco melograno menta, caramello al rum.","Sempre servito con cucchiaio."],
  ["Passion de cacao","Semisfera di cioccolato, gelato alla vaniglia, tortino al cioccolato e colata di fondente fuso.","Sempre servito con cucchiaio."],
  ["Ronda Mixto","Tartellette di pasta frolla con dulce de leche e scaglie di cioccolato fondente e bianco.","Servizio dessert condivisibile."],
  ["Churros","Graffette sudamericane servite con dulce de leche e cioccolato.","Sempre servite con salvietta imbevuta."],
  ["Corazon de lucuma","Tortino dal cuore caldo di lucuma, crumble cacao amaro, quinoa soffiata, gelato alla cannella e coulis di frutti di bosco.","Consigliare di mangiarlo prendendo tutti gli ingredienti insieme. Sempre servito con cucchiaio."],
  ["Ruota panoramica","Churros, Ronda Mixto, cioccolata bianca e fondente, bignè ripieno di panna e camote.","Sempre servita con candelotti se all'esterno e salviette imbevute."],
];

const beverageSeed = [
  ["Dom Perignon Brut","Champagne","Champagne",450,0,0,""],
  ["Dom Perignon Brut Rosé","Champagne","Champagne",600,0,0,""],
  ["Dom Perignon Brut P2","Champagne","Champagne",750,0,0,""],
  ["Krug Brut","Champagne","Champagne",480,0,0,""],
  ["Krug Brut Rosé 26ème edition","Champagne","Champagne",700,0,0,""],
  ["Armand de Brignac Gold","Champagne","Champagne",500,0,0,""],
  ["Ruinart Brut R","Champagne","Champagne",120,0,0,""],
  ["Ruinart Rosé","Champagne","Champagne",180,0,0,""],
  ["Ruinart Blanc de Blancs","Champagne","Champagne",190,0,0,""],
  ["Bruno Paillard Premiere Cuvée Brut","Champagne","Champagne",120,0,0,""],
  ["Bruno Paillard Blanc de Blancs","Champagne","Champagne",170,0,0,""],
  ["A. Robert Brut","Champagne","Champagne",80,0,0,18],
  ["Ca' del Bosco Dosage 0","Bollicine","Franciacorta",85,0,0,""],
  ["Ca' del Bosco Satèn","Bollicine","Franciacorta",85,0,0,""],
  ["Ca' del Bosco Cuvée Prestige","Bollicine","Franciacorta",70,0,0,14],
  ["Ca' del Bosco Cuvée Prestige Magnum","Bollicine","Franciacorta",140,0,0,""],
  ["Ca' del Bosco Rosé","Bollicine","Franciacorta",85,0,0,16],
  ["Bellavista Assemblage","Bollicine","Franciacorta",70,0,0,""],
  ["Bellavista Rosé","Bollicine","Franciacorta",90,0,0,""],
  ["Barone Pizzini Animante","Bollicine","Franciacorta",60,0,0,""],
  ["Contadi Castaldi Rosé","Bollicine","Franciacorta",50,0,0,""],
  ["Falanghina Cruna de Lago","Vini Bianchi","Campania",40,0,0,""],
  ["Fiano di Avellino Colli di Lapio","Vini Bianchi","Campania",40,0,0,""],
  ["Fiano di Avellino Ciro Picariello","Vini Bianchi","Campania",38,0,0,12],
  ["Fiano di Avellino Exultet","Vini Bianchi","Campania",75,0,0,""],
  ["Greco di tufo Giallo d'Arles","Vini Bianchi","Campania",75,0,0,""],
  ["Furore Bianco","Vini Bianchi","Campania",50,0,0,""],
  ["Fiorduva","Vini Bianchi","Campania",100,0,0,""],
  ["Gewürztraminer Tramin","Vini Bianchi","Trentino Alto Adige",35,0,0,12],
  ["Chardonnay Tramin","Vini Bianchi","Trentino Alto Adige",35,0,0,12],
  ["Pinot Grigio Tramin","Vini Bianchi","Trentino Alto Adige",35,0,0,12],
  ["Blangé Ceretto","Vini Bianchi","Piemonte",40,0,0,""],
  ["Rossj Bass Gaja","Vini Bianchi","Piemonte",120,0,0,""],
  ["Sharis Livio Felluga","Vini Bianchi","Friuli Venezia Giulia",35,0,0,""],
  ["Pinot Grigio Livio Felluga","Vini Bianchi","Friuli Venezia Giulia",38,0,0,""],
  ["Sauvignon Livio Felluga","Vini Bianchi","Friuli Venezia Giulia",38,0,0,12],
  ["Chardonnay Jermann","Vini Bianchi","Friuli Venezia Giulia",42,0,0,""],
  ["Vintage Tunina Jermann","Vini Bianchi","Friuli Venezia Giulia",90,0,0,""],
  ["Chardonnay Vie di Romans","Vini Bianchi","Friuli Venezia Giulia",75,0,0,""],
  ["Sauvignon Blanc Vie di Romans","Vini Bianchi","Friuli Venezia Giulia",75,0,0,""],
  ["Etna Bianco","Vini Bianchi","Sicilia",35,0,0,""],
  ["Grillo Passiperduti","Vini Bianchi","Sicilia",35,0,0,""],
  ["Chardonnay Chiaranda","Vini Bianchi","Sicilia",55,0,0,""],
  ["Chablis Albert Pic","Vini Bianchi","Francia",60,0,0,""],
  ["Chablis Premier Cru Bichot","Vini Bianchi","Francia",75,0,0,""],
  ["Chablis Grand Regnard","Vini Bianchi","Francia",110,0,0,""],
  ["Sancerre","Vini Bianchi","Francia",55,0,0,""],
  ["Riesling Princes Abbes","Vini Bianchi","Francia",65,0,0,""],
  ["Riesling Falkenstein","Vini Bianchi","Germania",40,0,0,""],
  ["Livio Felluga Rosé","Vini Rosé","Friuli Venezia Giulia",40,0,0,12],
  ["Lumera","Vini Rosé","Sicilia",40,0,0,""],
  ["Whispering Angel","Vini Rosé","Francia",50,0,0,""],
  ["Miraval Rosé","Vini Rosé","Francia",55,0,0,""],
  ["Sammarco Castello di Rampolla","Vini Rossi","Toscana",100,0,0,""],
  ["Concerto Fonterutoli 2013","Vini Rossi","Toscana",150,0,0,""],
  ["Tignanello 2020","Vini Rossi","Toscana",350,0,0,""],
  ["Sassicaia","Vini Rossi","Toscana",800,0,0,""],
  ["Aglianico L'Atto","Vini Rossi","Basilicata",40,0,0,""],
  ["Pinot Nero Franz Haas","Vini Rossi","Trentino Alto Adige",55,0,0,""],
  ["Pinot Nero Tramin","Vini Rossi","Trentino Alto Adige",35,0,0,12],
  ["Lagrein","Vini Rossi","Trentino Alto Adige",35,0,0,""],
  ["Amarone Zenato","Vini Rossi","Veneto",110,0,0,""],
  ["Barbera Montebruna","Vini Rossi","Piemonte",40,0,0,""],
  ["Sito Moresco Gaja","Vini Rossi","Piemonte",110,0,0,""],
  ["Barbaresco Rabajà","Vini Rossi","Piemonte",150,0,0,""],
  ["Montepulciano d'Abruzzo Marina Cvetic","Vini Rossi","Abruzzo",80,0,0,""],
  ["Bell'Assai Donnafugata","Vini Rossi","Sicilia",50,0,0,""],
  ["Pinot Noir Domaine Faiveley","Vini Rossi","Francia",80,0,0,""],
];

const inventorySeed = [
  ["Vini", "Sauvignon Tramin", 55],
  ["Vini", "Gewürztraminer Tramin", 46],
  ["Vini", "Gewürztraminer Franz Haas", 43],
  ["Vini", "Pinot Grigio Tramin", 42],
  ["Vini", "Sauvignon Felluga", 40],
  ["Vini", "Pinot Nero Tramin", 37],
  ["Bollicine", "A. Robert Brut", 36],
  ["Vini", "Manna Franz Haas", 33],
  ["Vini", "Chardonnay Chiaranda", 32],
  ["Vini", "Chinon Blanc", 31],
  ["Bollicine", "Cà del Bosco Satèn", 29],
  ["Vini", "Vintage Tunina", 23],
  ["Vini", "Pecorino", 22],
  ["Vini", "Riesling Bruno", 20],
  ["Bollicine", "Cà del Bosco Prestige", 19],
  ["Vini", "Chablis Premier Cru Bichot", 19],
  ["Bollicine", "A. Robert Rosé", 19],
  ["Vini", "Pinot Nero Franz Haas", 18],
  ["Vini", "Chablis Bichot", 16],
  ["Bollicine", "Cà del Bosco Dosage 0", 16],
  ["Vini", "Grillo Passiperduti", 15],
  ["Vini", "Lagrein", 14],
  ["Vini", "Sauvignon Gumphof", 14],
  ["Vini", "Furore Marisa Cuomo", 14],
  ["Vini", "Giallo d'Arles Quintodecimo", 13],
  ["Bollicine", "Bellavista Assemblage", 13],
  ["Vini", "Fiano Quintodecimo", 12],
  ["Bollicine", "Bruno Paillard Rosé", 12],
  ["Vini", "Chardonnay Jermann", 12],
  ["Vini", "Sauvignon Ladoucette", 11],
  ["Vini", "Vinnae Ribolla Gialla", 11],
  ["Vini", "Fiano Picariello", 11],
  ["Bollicine", "Barone Pizzini Animante", 10],
  ["Vini", "Sancerre", 10],
  ["Bollicine", "Cà del Bosco Rosé", 10],
  ["Vini", "Lumera", 9],
  ["Bollicine", "Ruinart Blanc de Blanc", 9],
  ["Vini", "Miraval Rosé", 9],
  ["Vini", "Sharis Felluga", 8],
  ["Vini", "Blangé", 7],
  ["Vini", "Pinot Bianco Gumphof", 7],
  ["Vini", "Fiano Clelia Romano", 6],
  ["Bollicine", "Cà del Bosco Magnum", 6],
  ["Bollicine", "Dom Perignon Brut", 6],
  ["Vini", "Chardonnay Vie de Romans", 6],
  ["Bollicine", "Ferghettina Rosé", 6],
  ["Vini", "Chablis Albert Pic", 6],
  ["Bollicine", "Ruinart Rosé", 6],
  ["Bollicine", "Dom Perignon Rosé", 6],
  ["Vini", "Chardonnay Felluga", 6],
  ["Vini", "Riesling Falkenstein", 6],
];

const initialData = {
  settings: {
    appTitle: "Urubamba Manager",
    managerName: "Diana",
    logoUrl: "/logo.png",
    backgroundUrl: "/bg.png",
    accent: "#7a1027",
    accent2: "#9f1734",
    glassOpacity: 0.76,
    lowStockDefault: 6,
    noteTurni: "X = servizio | L = doppio | Off = riposo | F = ferie",
  },
  dashboard: {
    dataServizio: "",
    shift: "Cena",
    noteRapide: "",
    copertiOggi: 0,
    incassoOggi: 0,
    copertiPrevisti: 0,
    totaleBeverage: 0,
    guestplan: 0,
    thefork: 0,
    walkin: 0,
    manceTotali: 0,
  },
  staff: [
    { id: 1, nome: "Diana", ruolo: "Manager", reparto: "Sala", note: "", coeffMance: 1.5 },
    { id: 2, nome: "Pietro", ruolo: "Sala", reparto: "Sala", note: "", coeffMance: 1 },
    { id: 3, nome: "Giovanni", ruolo: "Bar", reparto: "Bar", note: "", coeffMance: 1 },
    { id: 4, nome: "Symon", ruolo: "Runner", reparto: "Sala", note: "", coeffMance: 0.8 },
    { id: 5, nome: "Liliana", ruolo: "Sala", reparto: "Sala", note: "", coeffMance: 1 },
    { id: 6, nome: "Sayed", ruolo: "Sala", reparto: "Sala", note: "", coeffMance: 1 },
    { id: 7, nome: "Grazia", ruolo: "Sala", reparto: "Sala", note: "", coeffMance: 1 },
    { id: 8, nome: "Davide", ruolo: "Runner", reparto: "Sala", note: "", coeffMance: 0.8 },
    { id: 9, nome: "Valeria", ruolo: "Runner", reparto: "Sala", note: "", coeffMance: 0.8 },
    { id: 10, nome: "Domenica", ruolo: "Accoglienza", reparto: "Sala", note: "", coeffMance: 1 },
  ],
  haccp: [],
  magazzinoCucina: [],
  magazzinoDetergenti: [
    { id: 1, prodotto: "Sapone mani", quantita: 2, postazione: "Deposito interno", note: "" },
    { id: 2, prodotto: "Sapone piatti", quantita: 4, postazione: "Deposito interno", note: "" },
    { id: 3, prodotto: "Scope", quantita: 2, postazione: "Deposito esterno", note: "" },
    { id: 4, prodotto: "Palette", quantita: 2, postazione: "Deposito esterno", note: "" },
    { id: 5, prodotto: "Sapone pavimenti", quantita: 6, postazione: "Deposito interno", note: "" },
  ],
  turni: {
    weekLabel: "SETTIMANA DAL 9 AL 15 MARZO",
    rows: [
      { id: 1, nome: "Diana", lunCena: "Off", marCena: "X", merCena: "X", gioCena: "X", venCena: "X", sabPra: "L", sabCena: "L", domPra: "X", domCena: "" },
      { id: 2, nome: "Pietro", lunCena: "X", marCena: "X", merCena: "Off", gioCena: "X", venCena: "X", sabPra: "", sabCena: "X", domPra: "", domCena: "X" },
      { id: 3, nome: "Giovanni", lunCena: "X", marCena: "X", merCena: "Off", gioCena: "X", venCena: "X", sabPra: "L", sabCena: "L", domPra: "X", domCena: "" },
      { id: 4, nome: "Symon", lunCena: "Off", marCena: "X", merCena: "X", gioCena: "X", venCena: "X", sabPra: "", sabCena: "X", domPra: "", domCena: "X" },
      { id: 5, nome: "Liliana", lunCena: "F", marCena: "F", merCena: "F", gioCena: "F", venCena: "F", sabPra: "F", sabCena: "F", domPra: "F", domCena: "F" },
      { id: 6, nome: "Sayed", lunCena: "", marCena: "", merCena: "", gioCena: "", venCena: "X", sabPra: "", sabCena: "X", domPra: "", domCena: "X" },
      { id: 7, nome: "Grazia", lunCena: "Off", marCena: "X", merCena: "Off", gioCena: "X", venCena: "X", sabPra: "", sabCena: "X", domPra: "L", domCena: "L" },
      { id: 8, nome: "Davide", lunCena: "X", marCena: "", merCena: "X", gioCena: "", venCena: "X", sabPra: "L", sabCena: "L", domPra: "X", domCena: "" },
      { id: 9, nome: "Valeria", lunCena: "X", marCena: "", merCena: "", gioCena: "", venCena: "", sabPra: "L", sabCena: "L", domPra: "X", domCena: "" },
      { id: 10, nome: "Domenica", lunCena: "F", marCena: "F", merCena: "F", gioCena: "F", venCena: "F", sabPra: "F", sabCena: "F", domPra: "F", domCena: "F" },
    ],
  },
  attivita: [
    {
      id: 1,
      data: "2026-03-16",
      turnoKey: "lunCena",
      dipendente: "Pietro",
      tasks: [
        { id: 1, text: "Controllo fondo cassa", done: false },
        { id: 2, text: "Check prenotazioni e guest notes", done: false },
        { id: 3, text: "Organizzare evento Pasqua", done: false },
        { id: 4, text: "", done: false },
        { id: 5, text: "", done: false },
        { id: 6, text: "", done: false },
      ],
      note: "",
    },
  ],
  storia: {
    titolo: "Urubamba Nikkei Restaurant",
    testo:
      "Il nome Urubamba richiama il fiume peruviano che attraversa la regione di Cusco e rappresenta il viaggio culturale tra Perù, Giappone e Napoli.\n\nIl progetto nasce dalla scoperta della cucina Nikkei e racconta un incontro tra identità diverse, eleganza, contaminazione gastronomica e ospitalità contemporanea.",
  },
  schedePiatti: fullSchede.map((row, i) => ({ id: i + 1, piatto: row[0], storia: row[1], servizio: row[2] })),
  guestNotes: [{ id: 1, ospite: "Tavolo VIP", tavolo: "12", note: "Allergia a crostacei" }],
  inventario: inventorySeed.map((row, i) => ({
    id: i + 1,
    prodotto: row[1],
    categoria: row[0],
    quantita: row[2],
    soglia: 6,
    costoAcquisto: "",
  })),
  ordini: [{ id: 1, fornitore: "Ca' del Bosco", prodotto: "Cà del Bosco Prestige", quantitaOrdine: 24, stato: "Ordinato", dataOrdine: "", note: "" }],
  beverage: beverageSeed.map((row, i) => ({
    id: i + 1,
    voce: row[0],
    categoria: row[1],
    sottoCategoria: row[2],
    prezzoVendita: row[3],
    costoAcquisto: row[4],
    venduti: row[5],
    calice: row[6],
  })),
  foodCost: [
    {
      id: 1,
      piatto: "Ceviche Classica",
      prezzoVendita: 24,
      venduti: 0,
      ingredienti: [
        { id: 1, nome: "Spigola", grammi: 120, costoKg: 22 },
        { id: 2, nome: "Leche de tigre", grammi: 80, costoKg: 6 },
        { id: 3, nome: "Choclo", grammi: 40, costoKg: 4 },
        { id: 4, nome: "Camote", grammi: 60, costoKg: 3 },
      ],
    },
  ],
  drinkCost: [
    {
      id: 1,
      drink: "Pisco Sour",
      prezzoVendita: 14,
      venduti: 0,
      noteServizio: "Servire in coppetta fredda, garnish essenziale.",
      batchMl: 0,
      garnishCost: 0.2,
      scartoPercent: 5,
      ingredienti: [
        { id: 1, nome: "Pisco", ml: 60, costoLitro: 24 },
        { id: 2, nome: "Succo lime", ml: 30, costoLitro: 5 },
        { id: 3, nome: "Sciroppo zucchero", ml: 20, costoLitro: 3 },
        { id: 4, nome: "Albume", ml: 20, costoLitro: 6 },
      ],
    },
    {
      id: 2,
      drink: "Moscow Mule",
      prezzoVendita: 12,
      venduti: 0,
      noteServizio: "Servire in mug con ghiaccio pieno e lime.",
      batchMl: 0,
      garnishCost: 0.25,
      scartoPercent: 4,
      ingredienti: [
        { id: 1, nome: "Vodka", ml: 50, costoLitro: 12 },
        { id: 2, nome: "Ginger beer", ml: 120, costoLitro: 4 },
        { id: 3, nome: "Succo lime", ml: 15, costoLitro: 5 },
      ],
    },
    {
      id: 3,
      drink: "Negroni",
      prezzoVendita: 13,
      venduti: 0,
      noteServizio: "Old fashioned, grande cubo, zest arancia.",
      batchMl: 0,
      garnishCost: 0.3,
      scartoPercent: 3,
      ingredienti: [
        { id: 1, nome: "Gin", ml: 30, costoLitro: 18 },
        { id: 2, nome: "Vermouth Rosso", ml: 30, costoLitro: 10 },
        { id: 3, nome: "Bitter", ml: 30, costoLitro: 16 },
      ],
    },
  ],
  reportGiornalieri: [
    {
      id: 1,
      data: "2026-03-13",
      shift: "Cena",
      incasso: 0,
      coperti: 0,
      note: "",
      problemi: "",
      azioniDomani: "",
    },
  ],
  diario: [
    { id: 1, data: "2026-03-13", turnoKey: "venCena", note: "Servizio intenso ma fluido.", voti: [{ nome: "Pietro", voto: 4 }] },
  ],
};

export default function App() {
  const [data, setData] = useState(initialData);
  const [saveStatus, setSaveStatus] = useState("Pronto");
  const [isBooting, setIsBooting] = useState(true);

  const [role, setRole] = useState(null);
  const [section, setSection] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authUser, setAuthUser] = useState(null); // non usato in versione locale
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 900 : false);
  const [searchSchede, setSearchSchede] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [haccpDraft, setHaccpDraft] = useState({
    documento: "scheda lavorazione",
    prodotto: "",
    quantita: "",
    unita: "kg",
    lotto: "",
    scadenza: "",
    postazione: "Frigo",
    note: "",
  });
  const [beverageSearch, setBeverageSearch] = useState("");
  const [drinkSearch, setDrinkSearch] = useState("");
  const [saveMessage, setSaveMessage] = useState("Sincronizzazione cloud attiva");
  const saveTimerRef = useRef(null);


  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("app-data");
      if (saved) {
        setData(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Errore caricamento dati locali:", err);
      setData(initialData);
    } finally {
      setIsBooting(false);
    }
  }, []);

  useEffect(() => {
    if (isBooting) return;

    const timeout = setTimeout(() => {
      try {
        setSaveStatus("Salvataggio in corso...");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem("app-data", JSON.stringify(data));
        setSaveStatus("Salvato");
        setSaveMessage("Salvato sul dispositivo");
      } catch (err) {
        console.error("Errore salvataggio locale:", err);
        setSaveStatus("Errore salvataggio");
        setSaveMessage("Errore salvataggio locale");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [data, isBooting]);



  useEffect(() => {
    function onResize() {
      setIsMobileView(window.innerWidth <= 900);
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // Versione locale: niente Supabase, niente login cloud.
    // L'app parte sempre in modalità manager e salva sul dispositivo.
    setAuthUser(null);
    setRole("manager");
    setSection((current) => current || "dashboard");
    setSaveMessage("Salvataggio locale attivo");
    setIsBooting(false);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const effectiveRole = role || "manager";
  const currentMenu = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "notifiche", label: "Notifiche", icon: "🔔" },
  { key: "report", label: "Report automatico", icon: "🧾" },
  { key: "preordine", label: "Pre-Ordine", icon: "📦" },
  { key: "staff", label: "Staff", icon: "👥" },
  { key: "turni", label: "Turni", icon: "🗓️" },
  { key: "mance", label: "Mance", icon: "💰" },
  { key: "haccp", label: "HACCP", icon: "🧾" },
  { key: "storia", label: "Storia", icon: "📖" },
  { key: "schede", label: "Schede piatti", icon: "🍽️" },
  { key: "guest", label: "Guest notes", icon: "⭐" },
  { key: "inventario", label: "Inventario vini", icon: "🍷" },
  { key: "magazzinoCucina", label: "Magazzino cucina", icon: "🧊" },
  { key: "magazzinoDetergenti", label: "Magazzino detergenti", icon: "🧼" },
  { key: "ordini", label: "Ordini", icon: "🚚" },
  { key: "beverage", label: "Beverage", icon: "🍷" },
  { key: "foodcost", label: "Food cost", icon: "🧮" },
  { key: "drinkcost", label: "Drink cost", icon: "🍸" },
  { key: "diario", label: "Diario servizio", icon: "📝" },
  { key: "performance", label: "Performance staff", icon: "📈" },
  { key: "impostazioni", label: "Impostazioni", icon: "⚙️" },
];

  const presentiSettimana = useMemo(() => {
    return data.turni.rows.reduce((total, row) => {
      return total + turniCols.reduce((sum, col) => sum + getPresenceWeight(row[col.key]), 0);
    }, 0);
  }, [data.turni.rows]);

  const filteredSchede = useMemo(() => {
    const q = searchSchede.trim().toLowerCase();
    if (!q) return data.schedePiatti;
    return data.schedePiatti.filter((item) =>
      `${item.piatto} ${item.storia} ${item.servizio}`.toLowerCase().includes(q)
    );
  }, [searchSchede, data.schedePiatti]);

  const filteredInventario = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return data.inventario;
    return data.inventario.filter((item) =>
      `${item.prodotto} ${item.categoria}`.toLowerCase().includes(q)
    );
  }, [inventorySearch, data.inventario]);

  const filteredBeverage = useMemo(() => {
    const q = beverageSearch.trim().toLowerCase();
    if (!q) return data.beverage;
    return data.beverage.filter((item) =>
      `${item.voce} ${item.categoria} ${item.sottoCategoria || ""}`.toLowerCase().includes(q)
    );
  }, [beverageSearch, data.beverage]);

  const filteredDrinkCost = useMemo(() => {
    const q = drinkSearch.trim().toLowerCase();
    if (!q) return data.drinkCost;
    return data.drinkCost.filter((item) =>
      `${item.drink} ${item.noteServizio} ${item.ingredienti.map((ing) => ing.nome).join(" ")}`.toLowerCase().includes(q)
    );
  }, [drinkSearch, data.drinkCost]);

  const lowStockItems = useMemo(() => {
    return data.inventario.filter((item) => ["Sottoscorta", "Esaurito", "Bassa"].includes(getInventoryStatus(item)));
  }, [data.inventario]);

  const topBeverage = useMemo(() => {
    if (!data.beverage.length) return null;
    return [...data.beverage].sort((a, b) => safeNum(b.venduti) - safeNum(a.venduti))[0];
  }, [data.beverage]);

  const lowBeverage = useMemo(() => {
    if (!data.beverage.length) return null;
    return [...data.beverage].sort((a, b) => safeNum(a.venduti) - safeNum(b.venduti))[0];
  }, [data.beverage]);

  const topFood = useMemo(() => {
    if (!data.foodCost.length) return null;
    return [...data.foodCost].sort((a, b) => safeNum(b.venduti) - safeNum(a.venduti))[0];
  }, [data.foodCost]);

  const totalBeverageMargin = useMemo(() => {
    return data.beverage.reduce((sum, item) => {
      const unitMargin = safeNum(item.prezzoVendita) - safeNum(item.costoAcquisto);
      return sum + unitMargin * safeNum(item.venduti);
    }, 0);
  }, [data.beverage]);

  const totalDrinkMargin = useMemo(() => {
    return data.drinkCost.reduce((sum, item) => {
      const unitMargin = getDrinkMargin(item);
      return sum + unitMargin * safeNum(item.venduti);
    }, 0);
  }, [data.drinkCost]);

  const avgFoodCostPercent = useMemo(() => {
    if (!data.foodCost.length) return 0;
    return data.foodCost.reduce((sum, item) => sum + getFoodCostPercent(item), 0) / data.foodCost.length;
  }, [data.foodCost]);

  const avgDrinkCostPercent = useMemo(() => {
    if (!data.drinkCost.length) return 0;
    return data.drinkCost.reduce((sum, item) => sum + getDrinkCostPercent(item), 0) / data.drinkCost.length;
  }, [data.drinkCost]);

  const topDrink = useMemo(() => {
    if (!data.drinkCost.length) return null;
    return [...data.drinkCost].sort((a, b) => safeNum(b.venduti) - safeNum(a.venduti))[0];
  }, [data.drinkCost]);

  const lowMarginFoods = useMemo(() => {
    return data.foodCost.filter((item) => {
      const price = safeNum(item.prezzoVendita);
      const marginPct = price ? ((price - getFoodCostTotal(item)) / price) * 100 : 0;
      return price > 0 && marginPct < 65;
    });
  }, [data.foodCost]);

  const highDrinkCostItems = useMemo(() => {
    return data.drinkCost.filter((item) => getDrinkCostPercent(item) > 28);
  }, [data.drinkCost]);

  const beverageUnderStock = useMemo(() => {
    return data.beverage.filter((item) => {
      const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.voce));
      return linkedInv && ["Sottoscorta", "Esaurito", "Bassa"].includes(getInventoryStatus(linkedInv));
    });
  }, [data.beverage, data.inventario]);

  const salesOverview = useMemo(() => {
    const winesSold = data.beverage.reduce((sum, item) => sum + safeNum(item.venduti), 0);
    const drinksSold = data.drinkCost.reduce((sum, item) => sum + safeNum(item.venduti), 0);
    const foodSold = data.foodCost.reduce((sum, item) => sum + safeNum(item.venduti), 0);
    return { winesSold, drinksSold, foodSold };
  }, [data.beverage, data.drinkCost, data.foodCost]);

  const reportOverview = useMemo(() => {
    const totalIncasso = data.reportGiornalieri.reduce((sum, item) => sum + safeNum(item.incasso), 0);
    const totalCoperti = data.reportGiornalieri.reduce((sum, item) => sum + safeNum(item.coperti), 0);
    const avgScontrino = totalCoperti ? totalIncasso / totalCoperti : 0;
    return { totalIncasso, totalCoperti, avgScontrino };
  }, [data.reportGiornalieri]);

  const ordiniOverview = useMemo(() => {
    const ordinati = data.ordini.filter((o) => o.stato === "Ordinato").length;
    const consegnati = data.ordini.filter((o) => o.stato === "Consegnato").length;
    const rimandati = data.ordini.filter((o) => o.stato === "Rimandato").length;
    const fornitori = Array.from(new Set(data.ordini.map((o) => String(o.fornitore || "").trim()).filter(Boolean)));
    return { ordinati, consegnati, rimandati, fornitori };
  }, [data.ordini]);

  const fornitoriStats = useMemo(() => {
    const map = new Map();
    data.ordini.forEach((ordine) => {
      const key = String(ordine.fornitore || "Senza fornitore").trim() || "Senza fornitore";
      if (!map.has(key)) {
        map.set(key, { fornitore: key, totaleOrdini: 0, ordinati: 0, consegnati: 0, rimandati: 0 });
      }
      const row = map.get(key);
      row.totaleOrdini += 1;
      if (ordine.stato === "Ordinato") row.ordinati += 1;
      if (ordine.stato === "Consegnato") row.consegnati += 1;
      if (ordine.stato === "Rimandato") row.rimandati += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.totaleOrdini - a.totaleOrdini);
  }, [data.ordini]);

  const manceBreakdown = useMemo(() => {
    const byName = new Map();
    data.staff.forEach((person) => {
      byName.set(String(person.nome).toLowerCase(), {
        nome: person.nome,
        ruolo: person.ruolo,
        coeffMance: safeNum(person.coeffMance) || 1,
        presenze: 0,
        puntiTurno: 0,
      });
    });
    data.turni.rows.forEach((row) => {
      const record = byName.get(String(row.nome).toLowerCase());
      if (!record) return;
      turniCols.forEach((col) => {
        const pts = getPresenceWeight(row[col.key]);
        if (pts > 0) {
          record.presenze += 1;
          record.puntiTurno += pts;
        }
      });
    });
    const rows = Array.from(byName.values()).map((r) => ({ ...r, puntiMance: r.puntiTurno * r.coeffMance }));
    const totalPoints = rows.reduce((sum, r) => sum + r.puntiMance, 0);
    const totalTips = safeNum(data.dashboard.manceTotali);
    return {
      totalPoints,
      totalTips,
      rows: rows.map((r) => ({ ...r, quota: totalPoints > 0 ? (r.puntiMance / totalPoints) * totalTips : 0 })),
    };
  }, [data.staff, data.turni.rows, data.dashboard.manceTotali]);

  const performanceStaff = useMemo(() => {
    return data.staff.map((person) => {
      const presenze = data.turni.rows
        .filter((row) => String(row.nome).toLowerCase() === String(person.nome).toLowerCase())
        .reduce((sum, row) => sum + turniCols.reduce((s, col) => s + (getPresenceWeight(row[col.key]) > 0 ? 1 : 0), 0), 0);

      const relatedDiari = data.diario.map((day) => {
        const voto = day.voti.find((v) => String(v.nome).toLowerCase() === String(person.nome).toLowerCase());
        return voto ? safeNum(voto.voto) : null;
      }).filter((v) => v !== null);

      const mediaVoto = relatedDiari.length ? relatedDiari.reduce((s, v) => s + v, 0) / relatedDiari.length : 0;
      const taskCards = data.attivita.filter((card) => String(card.dipendente).toLowerCase() === String(person.nome).toLowerCase());
      const totalTasks = taskCards.reduce((sum, card) => sum + card.tasks.filter((t) => String(t.text || "").trim()).length, 0);
      const completedTasks = taskCards.reduce((sum, card) => sum + card.tasks.filter((t) => String(t.text || "").trim() && t.done).length, 0);
      const completionRate = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

      return {
        nome: person.nome,
        ruolo: person.ruolo,
        presenze,
        mediaVoto,
        totalTasks,
        completedTasks,
        completionRate,
      };
    }).sort((a, b) => b.mediaVoto - a.mediaVoto || b.completionRate - a.completionRate);
  }, [data.staff, data.turni.rows, data.diario, data.attivita]);


  const notificationsData = useMemo(() => {
    const viniSottoScorta = beverageUnderStock.map((item) => {
      const inv = data.inventario.find((x) => labelsMatch(x.prodotto, item.voce));
      return `${item.voce}: ${inv ? `${inv.quantita} bottiglie` : "non collegato"}`;
    });

    const mansioniAperte = data.attivita.reduce(
      (sum, card) => sum + card.tasks.filter((t) => String(t.text || "").trim() && !t.done).length,
      0
    );

    const drinkFuoriTarget = highDrinkCostItems.map((item) => `${item.drink}: ${getDrinkCostPercent(item).toFixed(1)}%`);

    return {
      viniSottoScorta,
      mansioniAperte,
      drinkFuoriTarget,
      ordiniAperti: ordiniOverview.ordinati,
    };
  }, [beverageUnderStock, data.inventario, data.attivita, highDrinkCostItems, ordiniOverview.ordinati]);

  const confrontiData = useMemo(() => {
    const reports = [...data.reportGiornalieri].filter((r) => r.data).sort((a, b) => String(a.data).localeCompare(String(b.data)));
    const last = reports[reports.length - 1] || null;
    const prev = reports[reports.length - 2] || null;

    const compare = (a, b) => {
      const av = safeNum(a);
      const bv = safeNum(b);
      const diff = av - bv;
      const pct = bv ? (diff / bv) * 100 : 0;
      return { diff, pct };
    };

    const weekCurrent = reports.slice(-7);
    const weekPrev = reports.slice(-14, -7);

    const sumBlock = (arr, field) => arr.reduce((s, x) => s + safeNum(x[field]), 0);

    return {
      last,
      prev,
      incassoDay: compare(last?.incasso, prev?.incasso),
      copertiDay: compare(last?.coperti, prev?.coperti),
      weekCurrentIncasso: sumBlock(weekCurrent, "incasso"),
      weekPrevIncasso: sumBlock(weekPrev, "incasso"),
      weekCurrentCoperti: sumBlock(weekCurrent, "coperti"),
      weekPrevCoperti: sumBlock(weekPrev, "coperti"),
    };
  }, [data.reportGiornalieri]);

  const consigliAutomatici = useMemo(() => {
    const tips = [];
    if (topBeverage && safeNum(topBeverage.venduti) > 0) {
      tips.push(`Spingi ${topBeverage.voce}: è il vino più venduto al momento.`);
    }
    if (topDrink && safeNum(topDrink.venduti) > 0) {
      tips.push(`Tieni in evidenza ${topDrink.drink}: sta trainando il bar.`);
    }
    if (lowMarginFoods.length) {
      tips.push(`Controlla ${lowMarginFoods[0].piatto}: il margine è basso e va rivisto.`);
    }
    if (highDrinkCostItems.length) {
      tips.push(`Rivedi ${highDrinkCostItems[0].drink}: il drink cost è sopra target.`);
    }
    if (beverageUnderStock.length) {
      tips.push(`Ordina ${beverageUnderStock[0].voce}: è tra le etichette sotto scorta.`);
    }
    if (performanceStaff.length) {
      const best = performanceStaff[0];
      if (best.mediaVoto >= 8 || best.completionRate >= 80) {
        tips.push(`Premia ${best.nome}: oggi/periodo è il profilo più forte del team.`);
      }
      const weak = [...performanceStaff].reverse().find((p) => p.presenze > 0 || p.totalTasks > 0);
      if (weak && (weak.mediaVoto > 0 || weak.totalTasks > 0)) {
        tips.push(`Segui da vicino ${weak.nome}: ha margine di miglioramento su voto o completamento mansioni.`);
      }
    }
    return tips.slice(0, 6);
  }, [topBeverage, topDrink, lowMarginFoods, highDrinkCostItems, beverageUnderStock, performanceStaff]);



  function classifyKitchenCategory(prodotto) {
    const n = normalizeLabel(prodotto);
    if (!n) return "Altro cucina";
    if (/salmone|tonno|spigola|branzino|ricciola|gamber|astice|polpo|capasant|seppia|scampi|carabineros|granchio/.test(n)) return "Pesce";
    if (/pollo|manzo|maiale|wagyu|picanha/.test(n)) return "Carne";
    if (/lime|limone|mango|maracuja|alkekengi|frutti di bosco|cocco/.test(n)) return "Frutta";
    if (/avocado|cipolla|zenzero|cetriolo|camote|choclo|mais|quinoa|patata|peperon|coriandolo/.test(n)) return "Verdura";
    return "Altro cucina";
  }

  function addOrUpdateKitchenStock(prevKitchen, draft) {
    const qty = safeNum(draft.quantita);
    const prodotto = String(draft.prodotto || "").trim();
    if (!prodotto) return prevKitchen;
    const existingIndex = prevKitchen.findIndex((item) => labelsMatch(item.prodotto, prodotto));
    if (existingIndex >= 0) {
      return prevKitchen.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              categoria: classifyKitchenCategory(prodotto),
              quantita: safeNum(item.quantita) + qty,
              lotto: draft.lotto || item.lotto || "",
              scadenza: draft.scadenza || item.scadenza || "",
              postazione: draft.postazione || item.postazione || "Frigo",
              note: draft.note || item.note || "",
              ultimaRegistrazione: new Date().toISOString().slice(0, 10),
            }
          : item
      );
    }
    return [
      {
        id: uid(),
        prodotto,
        categoria: classifyKitchenCategory(prodotto),
        quantita: qty,
        unita: draft.unita || "kg",
        lotto: draft.lotto || "",
        scadenza: draft.scadenza || "",
        postazione: draft.postazione || "Frigo",
        note: draft.note || "",
        ultimaRegistrazione: new Date().toISOString().slice(0, 10),
      },
      ...prevKitchen,
    ];
  }

  function saveHaccpDraft() {
    const prodotto = String(haccpDraft.prodotto || "").trim();
    if (!prodotto) return;

    const nuovo = {
      id: uid(),
      tipo: haccpDraft.documento || "scheda lavorazione",
      prodotto,
      quantita: haccpDraft.quantita,
      unita: haccpDraft.unita,
      lotto: haccpDraft.lotto,
      scadenza: haccpDraft.scadenza,
      postazione: haccpDraft.postazione,
      categoria: classifyKitchenCategory(prodotto),
      note: haccpDraft.note,
      data: new Date().toISOString().slice(0, 16),
    };

    setData((prev) => ({
      ...prev,
      haccp: [nuovo, ...(prev.haccp || [])],
      magazzinoCucina: addOrUpdateKitchenStock(prev.magazzinoCucina || [], haccpDraft),
    }));

    setHaccpDraft({
      documento: "scheda lavorazione",
      prodotto: "",
      quantita: "",
      unita: "kg",
      lotto: "",
      scadenza: "",
      postazione: "Frigo",
      note: "",
    });
  }

  function addDetergente() {
    setData((prev) => ({
      ...prev,
      magazzinoDetergenti: [
        { id: uid(), prodotto: "", quantita: 0, postazione: "Deposito interno", note: "" },
        ...(prev.magazzinoDetergenti || []),
      ],
    }));
  }

  function updateDetergente(id, field, value) {
    setData((prev) => ({
      ...prev,
      magazzinoDetergenti: (prev.magazzinoDetergenti || []).map((item) =>
        item.id === id ? { ...item, [field]: field === "quantita" ? safeNum(value) : value } : item
      ),
    }));
  }

  function deleteDetergente(id) {
    setData((prev) => ({
      ...prev,
      magazzinoDetergenti: (prev.magazzinoDetergenti || []).filter((item) => item.id !== id),
    }));
  }

  function patch(path, value) {
    setData((prev) => {
      const copy = structuredClone(prev);
      let ref = copy;
      for (let i = 0; i < path.length - 1; i += 1) ref = ref[path[i]];
      ref[path[path.length - 1]] = value;
      return copy;
    });
  }

  async function handleLogin() {
    setLoginError("");

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === LOCAL_MANAGER_EMAIL.toLowerCase() && password === LOCAL_MANAGER_PASSWORD) {
      setRole("manager");
      setSection("dashboard");
      setMobileMenuOpen(false);
      setPassword("");
      return;
    }

    if (cleanEmail === LOCAL_STAFF_EMAIL.toLowerCase() && password === LOCAL_STAFF_PASSWORD) {
      setRole("staff");
      setSection("turni");
      setMobileMenuOpen(false);
      setPassword("");
      return;
    }

    setLoginError("Email o password non corrette.");
  }

  function logout() {
    setRole(null);
    setSection("dashboard");
    setMobileMenuOpen(false);
    setPassword("");
    setEmail("");
    setLoginError("");
  }

  function updateArrayItem(sectionName, id, field, value) {
    setData((prev) => ({
      ...prev,
      [sectionName]: prev[sectionName].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  }
  function addStaff() {
    setData((prev) => ({
      ...prev,
      staff: [...prev.staff, { id: uid(), nome: "", ruolo: "Sala", reparto: "Sala", note: "", coeffMance: 1 }],
    }));
  }
function addHaccp() {
  const nuovo = {
    id: Date.now(),
    tipo: "Frigo",
    valore: "",
    note: "",
    data: new Date().toISOString().slice(0, 16),
  };

  setData(prev => ({
    ...prev,
    haccp: [nuovo, ...(prev.haccp || [])],
  }));
}
  function deleteStaff(id) {
    setData((prev) => ({ ...prev, staff: prev.staff.filter((item) => item.id !== id) }));
  }
  function addTurnoRow() {
    setData((prev) => ({
      ...prev,
      turni: {
        ...prev.turni,
        rows: [...prev.turni.rows, { id: uid(), nome: "", lunCena: "", marCena: "", merCena: "", gioCena: "", venCena: "", sabPra: "", sabCena: "", domPra: "", domCena: "" }],
      },
    }));
  }
  function updateTurno(id, field, value) {
    setData((prev) => ({
      ...prev,
      turni: { ...prev.turni, rows: prev.turni.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)) },
    }));
  }
  function deleteTurnoRow(id) {
    setData((prev) => ({ ...prev, turni: { ...prev.turni, rows: prev.turni.rows.filter((row) => row.id !== id) } }));
  }

  function addAttivitaCard() {
    setData((prev) => ({
      ...prev,
      attivita: [...prev.attivita, { id: uid(), data: "", turnoKey: "lunCena", dipendente: "", tasks: Array.from({ length: 6 }, () => ({ id: uid(), text: "", done: false })), note: "" }],
    }));
  }
  function updateAttivitaCard(id, field, value) {
    setData((prev) => ({ ...prev, attivita: prev.attivita.map((card) => (card.id === id ? { ...card, [field]: value } : card)) }));
  }
  function deleteAttivitaCard(id) {
    setData((prev) => ({ ...prev, attivita: prev.attivita.filter((card) => card.id !== id) }));
  }
  function addTask(cardId) {
    setData((prev) => ({
      ...prev,
      attivita: prev.attivita.map((card) => card.id === cardId ? { ...card, tasks: [...card.tasks, { id: uid(), text: "", done: false }] } : card),
    }));
  }
  function updateTask(cardId, taskId, field, value) {
    setData((prev) => ({
      ...prev,
      attivita: prev.attivita.map((card) =>
        card.id === cardId
          ? { ...card, tasks: card.tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)) }
          : card
      ),
    }));
  }
  function deleteTask(cardId, taskId) {
    setData((prev) => ({
      ...prev,
      attivita: prev.attivita.map((card) => card.id === cardId ? { ...card, tasks: card.tasks.filter((task) => task.id !== taskId) } : card),
    }));
  }

  function addScheda() {
    setData((prev) => ({ ...prev, schedePiatti: [...prev.schedePiatti, { id: uid(), piatto: "", storia: "", servizio: "" }] }));
  }
  function deleteScheda(id) {
    setData((prev) => ({ ...prev, schedePiatti: prev.schedePiatti.filter((item) => item.id !== id) }));
  }
  function updateScheda(id, field, value) {
    setData((prev) => ({ ...prev, schedePiatti: prev.schedePiatti.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }

  function addGuest() {
    setData((prev) => ({ ...prev, guestNotes: [...prev.guestNotes, { id: uid(), ospite: "", tavolo: "", note: "" }] }));
  }
  function updateGuest(id, field, value) {
    setData((prev) => ({ ...prev, guestNotes: prev.guestNotes.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteGuest(id) {
    setData((prev) => ({ ...prev, guestNotes: prev.guestNotes.filter((item) => item.id !== id) }));
  }

  function addInventory() {
    setData((prev) => ({
      ...prev,
      inventario: [...prev.inventario, { id: uid(), prodotto: "", categoria: "", quantita: 0, soglia: prev.settings.lowStockDefault, costoAcquisto: "" }],
    }));
  }
  function updateInventory(id, field, value) {
    setData((prev) => ({ ...prev, inventario: prev.inventario.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteInventory(id) {
    setData((prev) => ({ ...prev, inventario: prev.inventario.filter((item) => item.id !== id) }));
  }

  function syncBeverageToInventory() {
    setData((prev) => {
      const inventory = [...prev.inventario];
      prev.beverage.forEach((wine) => {
        const existing = inventory.find((inv) => labelsMatch(inv.prodotto, wine.voce));
        if (!existing) {
          inventory.push({
            id: uid(),
            prodotto: wine.voce,
            categoria: wine.categoria || "Vino",
            quantita: 0,
            soglia: prev.settings.lowStockDefault,
            costoAcquisto: wine.costoAcquisto || "",
          });
        }
      });
      return { ...prev, inventario: inventory };
    });
  }

  function increaseInventoryFromBeverage(beverageId) {
    setData((prev) => {
      const beverageItem = prev.beverage.find((b) => b.id === beverageId);
      if (!beverageItem) return prev;
      const exists = prev.inventario.some((inv) => labelsMatch(inv.prodotto, beverageItem.voce));
      if (!exists) {
        return {
          ...prev,
          inventario: [
            ...prev.inventario,
            {
              id: uid(),
              prodotto: beverageItem.voce,
              categoria: beverageItem.categoria || "Vino",
              quantita: 1,
              soglia: prev.settings.lowStockDefault,
              costoAcquisto: beverageItem.costoAcquisto || "",
            },
          ],
        };
      }
      return {
        ...prev,
        inventario: prev.inventario.map((inv) =>
          labelsMatch(inv.prodotto, beverageItem.voce)
            ? { ...inv, quantita: safeNum(inv.quantita) + 1 }
            : inv
        ),
      };
    });
  }

  function createOrderFromBeverage(beverageItem) {
    setData((prev) => {
      const linkedInv = prev.inventario.find((inv) => labelsMatch(inv.prodotto, beverageItem.voce));
      const item = linkedInv || {
        prodotto: beverageItem.voce,
        categoria: beverageItem.categoria || "Vino",
        quantita: 0,
        soglia: prev.settings.lowStockDefault,
      };
      const suggestedQty = getSuggestedOrderQty(item);
      return {
        ...prev,
        ordini: [
          ...prev.ordini,
          {
            id: uid(),
            fornitore: beverageItem.sottoCategoria || beverageItem.categoria || "",
            prodotto: beverageItem.voce,
            quantitaOrdine: suggestedQty || 6,
            stato: "Ordinato",
            dataOrdine: "",
            note: "Ordine creato dalla sezione Beverage",
          },
        ],
      };
    });
  }

  function addOrdineFromInventory(item) {
    const suggestedQty = getSuggestedOrderQty(item);
    setData((prev) => ({
      ...prev,
      ordini: [...prev.ordini, { id: uid(), fornitore: "", prodotto: item.prodotto, quantitaOrdine: suggestedQty, stato: "Ordinato", dataOrdine: "", note: "" }],
    }));
  }
  function addOrdineManual() {
    setData((prev) => ({
      ...prev,
      ordini: [...prev.ordini, { id: uid(), fornitore: "", prodotto: "", quantitaOrdine: 0, stato: "Ordinato", dataOrdine: "", note: "" }],
    }));
  }
  function updateOrdine(id, field, value) {
    setData((prev) => ({ ...prev, ordini: prev.ordini.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteOrdine(id) {
    setData((prev) => ({ ...prev, ordini: prev.ordini.filter((item) => item.id !== id) }));
  }

  function addBeverage() {
    setData((prev) => ({
      ...prev,
      beverage: [...prev.beverage, { id: uid(), voce: "", categoria: "Vino", sottoCategoria: "", prezzoVendita: 0, costoAcquisto: 0, venduti: 0, calice: "" }],
    }));
  }
  function updateBeverage(id, field, value) {
    setData((prev) => ({ ...prev, beverage: prev.beverage.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteBeverage(id) {
    setData((prev) => ({ ...prev, beverage: prev.beverage.filter((item) => item.id !== id) }));
  }
  function markBeverageSold(id) {
    setData((prev) => {
      const beverageItem = prev.beverage.find((b) => b.id === id);
      if (!beverageItem) return prev;

      const hasLinkedInventory = prev.inventario.some((inv) => labelsMatch(inv.prodotto, beverageItem.voce));
      const nextInventory = hasLinkedInventory
        ? prev.inventario.map((inv) =>
            labelsMatch(inv.prodotto, beverageItem.voce)
              ? { ...inv, quantita: Math.max(safeNum(inv.quantita) - 1, 0) }
              : inv
          )
        : [
            ...prev.inventario,
            {
              id: uid(),
              prodotto: beverageItem.voce,
              categoria: beverageItem.categoria || "Vino",
              quantita: 0,
              soglia: prev.settings.lowStockDefault,
              costoAcquisto: beverageItem.costoAcquisto || "",
            },
          ];

      return {
        ...prev,
        beverage: prev.beverage.map((item) =>
          item.id === id ? { ...item, venduti: safeNum(item.venduti) + 1 } : item
        ),
        inventario: nextInventory,
      };
    });
  }


  function addFoodCost() {
    setData((prev) => ({
      ...prev,
      foodCost: [...prev.foodCost, { id: uid(), piatto: "", prezzoVendita: 0, venduti: 0, ingredienti: [{ id: uid(), nome: "", grammi: 0, costoKg: 0 }] }],
    }));
  }
  function updateFoodCost(id, field, value) {
    setData((prev) => ({ ...prev, foodCost: prev.foodCost.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteFoodCost(id) {
    setData((prev) => ({ ...prev, foodCost: prev.foodCost.filter((item) => item.id !== id) }));
  }
  function addIngredient(foodId) {
    setData((prev) => ({
      ...prev,
      foodCost: prev.foodCost.map((item) => item.id === foodId ? { ...item, ingredienti: [...item.ingredienti, { id: uid(), nome: "", grammi: 0, costoKg: 0 }] } : item),
    }));
  }
  function updateIngredient(foodId, ingId, field, value) {
    setData((prev) => ({
      ...prev,
      foodCost: prev.foodCost.map((item) =>
        item.id === foodId ? { ...item, ingredienti: item.ingredienti.map((ing) => (ing.id === ingId ? { ...ing, [field]: value } : ing)) } : item
      ),
    }));
  }
  function deleteIngredient(foodId, ingId) {
    setData((prev) => ({
      ...prev,
      foodCost: prev.foodCost.map((item) => item.id === foodId ? { ...item, ingredienti: item.ingredienti.filter((ing) => ing.id !== ingId) } : item),
    }));
  }

  function addDrinkCost() {
    setData((prev) => ({
      ...prev,
      drinkCost: [...prev.drinkCost, { id: uid(), drink: "", prezzoVendita: 0, venduti: 0, noteServizio: "", batchMl: 0, garnishCost: 0, scartoPercent: 0, ingredienti: [{ id: uid(), nome: "", ml: 0, costoLitro: 0 }] }],
    }));
  }
  function updateDrinkCost(id, field, value) {
    setData((prev) => ({ ...prev, drinkCost: prev.drinkCost.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function deleteDrinkCost(id) {
    setData((prev) => ({ ...prev, drinkCost: prev.drinkCost.filter((item) => item.id !== id) }));
  }
  function addDrinkIngredient(drinkId) {
    setData((prev) => ({
      ...prev,
      drinkCost: prev.drinkCost.map((item) => item.id === drinkId ? { ...item, ingredienti: [...item.ingredienti, { id: uid(), nome: "", ml: 0, costoLitro: 0 }] } : item),
    }));
  }
  function updateDrinkIngredient(drinkId, ingId, field, value) {
    setData((prev) => ({
      ...prev,
      drinkCost: prev.drinkCost.map((item) =>
        item.id === drinkId ? { ...item, ingredienti: item.ingredienti.map((ing) => (ing.id === ingId ? { ...ing, [field]: value } : ing)) } : item
      ),
    }));
  }
  function deleteDrinkIngredient(drinkId, ingId) {
    setData((prev) => ({
      ...prev,
      drinkCost: prev.drinkCost.map((item) => item.id === drinkId ? { ...item, ingredienti: item.ingredienti.filter((ing) => ing.id !== ingId) } : item),
    }));
  }

  function addDiario() {
    setData((prev) => ({ ...prev, diario: [...prev.diario, { id: uid(), data: "", turnoKey: "lunCena", note: "", voti: [] }] }));
  }
  function updateDiario(id, field, value) {
    setData((prev) => ({ ...prev, diario: prev.diario.map((item) => (item.id === id ? { ...item, [field]: value } : item)) }));
  }
  function updateDiarioVoto(diarioId, nome, voto) {
    setData((prev) => ({
      ...prev,
      diario: prev.diario.map((item) => {
        if (item.id !== diarioId) return item;
        const filtered = item.voti.filter((v) => v.nome !== nome);
        return { ...item, voti: [...filtered, { nome, voto }] };
      }),
    }));
  }
  function deleteDiario(id) {
    setData((prev) => ({ ...prev, diario: prev.diario.filter((item) => item.id !== id) }));
  }

  function addReport() {
    setData((prev) => ({
      ...prev,
      reportGiornalieri: [
        ...prev.reportGiornalieri,
        {
          id: uid(),
          data: "",
          shift: "Cena",
          incasso: 0,
          coperti: 0,
          note: "",
          problemi: "",
          azioniDomani: "",
        },
      ],
    }));
  }

  function updateReport(id, field, value) {
    setData((prev) => ({
      ...prev,
      reportGiornalieri: prev.reportGiornalieri.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function deleteReport(id) {
    setData((prev) => ({
      ...prev,
      reportGiornalieri: prev.reportGiornalieri.filter((item) => item.id !== id),
    }));
  }

  function getFoodCostTotal(item) {
    return item.ingredienti.reduce((sum, ing) => sum + calcIngredientCost(ing.grammi, ing.costoKg), 0);
  }
  function getFoodCostPercent(item) {
    const total = getFoodCostTotal(item);
    const price = safeNum(item.prezzoVendita);
    return !price ? 0 : (total / price) * 100;
  }
  function calcDrinkIngredientCost(ml, costoLitro) {
    return (safeNum(ml) / 1000) * safeNum(costoLitro);
  }
  function getDrinkBaseCost(item) {
    return item.ingredienti.reduce((sum, ing) => sum + calcDrinkIngredientCost(ing.ml, ing.costoLitro), 0);
  }
  function getDrinkTotalMl(item) {
    return item.ingredienti.reduce((sum, ing) => sum + safeNum(ing.ml), 0);
  }
  function getDrinkCostTotal(item) {
    const base = getDrinkBaseCost(item);
    const garnish = safeNum(item.garnishCost);
    const scarto = base * (safeNum(item.scartoPercent) / 100);
    return base + garnish + scarto;
  }
  function getDrinkCostPercent(item) {
    const total = getDrinkCostTotal(item);
    const price = safeNum(item.prezzoVendita);
    return !price ? 0 : (total / price) * 100;
  }
  function getDrinkMargin(item) {
    return safeNum(item.prezzoVendita) - getDrinkCostTotal(item);
  }
  function getDrinkBatchYield(item) {
    const batch = safeNum(item.batchMl);
    const totalMl = getDrinkTotalMl(item);
    if (!batch || !totalMl) return 0;
    return Math.floor(batch / totalMl);
  }


  function downloadBackup() {
    try {
      const payload = {
        exported_at: new Date().toISOString(),
        app_title: data.settings?.appTitle || "Urubamba Manager",
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `urubamba-backup-${datePart}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSaveMessage("Backup scaricato");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveMessage("Sincronizzazione cloud attiva"), 1200);
    } catch (err) {
      console.error("Errore backup:", err);
      setSaveMessage("Errore backup");
    }
  }

  function restoreBackupFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const nextData = parsed?.data || parsed;
        if (!nextData || typeof nextData !== "object") {
          throw new Error("Backup non valido");
        }
        setData(nextData);
        setSaveMessage("Backup ripristinato");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveMessage("Sincronizzazione cloud attiva"), 1200);
      } catch (err) {
        console.error("Errore ripristino backup:", err);
        setSaveMessage("Errore ripristino");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file, "utf-8");
  }


  function exportCSV() {
    try {
      const escapeCSV = (value) => {
        const str = String(value ?? "");
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const sections = [];

      sections.push([
        ["SEZIONE", "PRODOTTO", "CATEGORIA", "QUANTITA", "SOGLIA", "COSTO_ACQUISTO"],
        ...(data.inventario || []).map((item) => [
          "Inventario",
          item.prodotto,
          item.categoria,
          item.quantita,
          item.soglia,
          item.costoAcquisto,
        ]),
      ]);

      sections.push([
        ["SEZIONE", "VOCE", "CATEGORIA", "ZONA", "CALICE", "PREZZO_VENDITA", "COSTO_ACQUISTO", "VENDUTI"],
        ...(data.beverage || []).map((item) => [
          "Beverage",
          item.voce,
          item.categoria,
          item.sottoCategoria || "",
          item.calice || "",
          item.prezzoVendita,
          item.costoAcquisto,
          item.venduti,
        ]),
      ]);

      sections.push([
        ["SEZIONE", "PRODOTTO", "FORNITORE", "QUANTITA_ORDINE", "STATO", "DATA_ORDINE", "NOTE"],
        ...(data.ordini || []).map((item) => [
          "Ordini",
          item.prodotto,
          item.fornitore,
          item.quantitaOrdine,
          item.stato,
          item.dataOrdine,
          item.note,
        ]),
      ]);

      sections.push([
        ["SEZIONE", "DATA", "SHIFT", "INCASSO", "COPERTI", "NOTE", "PROBLEMI", "AZIONI_DOMANI"],
        ...(data.reportGiornalieri || []).map((item) => [
          "Report",
          item.data,
          item.shift,
          item.incasso,
          item.coperti,
          item.note,
          item.problemi,
          item.azioniDomani,
        ]),
      ]);

      const csvContent = sections
        .map((section) => section.map((row) => row.map(escapeCSV).join(",")).join("\n"))
        .join("\n\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const datePart = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `urubamba-export-${datePart}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaveMessage("Export CSV pronto");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveMessage("Sincronizzazione cloud attiva"), 1200);
    } catch (err) {
      console.error("Errore export CSV:", err);
      setSaveMessage("Errore export");
    }
  }

  function renderLogin() {
    return (
      <div className="loginPage" style={{ "--bg-url": `url(${data.settings.backgroundUrl})` }}>
        <div className="pageOverlay" />
        <div className="loginGrid">
          <div className="glassCard loginCard">
            <div className="logoWrap">
              <img src={data.settings.logoUrl} alt="Urubamba logo" />
            </div>
            <h1>{data.settings.appTitle}</h1>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="Inserisci email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Inserisci password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </div>
            <div className="stackButtons">
              <button className="btn btnPrimary" onClick={handleLogin}>Entra</button>
            </div>
            {loginError ? <div className="message error">{loginError}</div> : null}
          </div>

          <div className="glassCard storyCard">
            <h2>{data.storia.titolo}</h2>
            {data.storia.testo.split("\n\n").filter((paragraph) => !paragraph.toLowerCase().includes("completamente modificabile")).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </div>
      </div>
    );
  }

  function renderHero(title, subtitle) {
    return (
      <section className="hero">
        <div className="heroShade" />
        <div className="heroContent">
          <div className="heroLogo"><img src={data.settings.logoUrl} alt="Urubamba logo" /></div>
          <div>
            <div className="eyebrow">URUBAMBA NIKKEI RESTAURANT</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
      </section>
    );
  }

  function renderDashboard() {
    const scontrino = safeNum(data.dashboard.copertiOggi) > 0 ? safeNum(data.dashboard.incassoOggi) / safeNum(data.dashboard.copertiOggi) : 0;
    const deltaCoperti = safeNum(data.dashboard.copertiOggi) - safeNum(data.dashboard.copertiPrevisti);
    const deltaLabel = deltaCoperti > 0 ? `+${deltaCoperti}` : `${deltaCoperti}`;

    return (
      <>
        {renderHero("Dashboard Gestionale Pro", "Incassi, margini, performance e alert critici in un solo colpo d'occhio.")}

        <section className="grid five">
          <div className="kpiCard"><span>Coperti oggi</span><strong>{data.dashboard.copertiOggi}</strong></div>
          <div className="kpiCard"><span>Incasso oggi</span><strong>{euro(data.dashboard.incassoOggi)}</strong></div>
          <div className="kpiCard"><span>Scontrino medio</span><strong>{euro(scontrino)}</strong></div>
          <div className="kpiCard"><span>Margine beverage</span><strong>{euro(totalBeverageMargin)}</strong></div>
          <div className="kpiCard"><span>Margine drink</span><strong>{euro(totalDrinkMargin)}</strong></div>
        </section>

        <section className="grid four">
          <div className="miniCard"><span>Coperti previsti</span><strong>{data.dashboard.copertiPrevisti}</strong></div>
          <div className="miniCard"><span>Scostamento coperti</span><strong>{deltaLabel}</strong></div>
          <div className="miniCard"><span>Food cost medio</span><strong>{avgFoodCostPercent.toFixed(1)}%</strong></div>
          <div className="miniCard"><span>Drink cost medio</span><strong>{avgDrinkCostPercent.toFixed(1)}%</strong></div>
        </section>

        <section className="grid three topMargin">
          <div className="panel">
            <h2>Top performance</h2>
            <div className="miniCard"><span>Top vino</span><strong>{topBeverage ? topBeverage.voce : "-"}</strong></div>
            <div className="miniCard topMargin"><span>Top drink</span><strong>{topDrink ? topDrink.drink : "-"}</strong></div>
            <div className="miniCard topMargin"><span>Top piatto</span><strong>{topFood ? topFood.piatto : "-"}</strong></div>
          </div>

          <div className="panel">
            <h2>Volumi vendita</h2>
            <div className="miniCard"><span>Bottiglie vendute</span><strong>{salesOverview.winesSold}</strong></div>
            <div className="miniCard topMargin"><span>Drink venduti</span><strong>{salesOverview.drinksSold}</strong></div>
            <div className="miniCard topMargin"><span>Piatti venduti</span><strong>{salesOverview.foodSold}</strong></div>
          </div>

          <div className="panel">
            <h2>Mance e servizio</h2>
            <div className="miniCard"><span>Mance totali</span><strong>{euro(data.dashboard.manceTotali)}</strong></div>
            <div className="miniCard topMargin"><span>Punti mance</span><strong>{manceBreakdown.totalPoints.toFixed(2)}</strong></div>
            <div className="miniCard topMargin"><span>Shift</span><strong>{data.dashboard.shift || "-"}</strong></div>
          </div>
        </section>

        <section className="grid three topMargin">
          <div className="panel">
            <h2>Alert inventario</h2>
            <div className="readBox">{beverageUnderStock.length ? `${beverageUnderStock.length} etichette beverage sotto controllo` : "Nessun alert beverage."}</div>
            <div className="topMargin" style={{ display: "grid", gap: 8 }}>
              {beverageUnderStock.slice(0, 6).map((item) => {
                const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.voce));
                return (
                  <div key={item.id} className="miniCard">
                    <span>{item.voce}</span>
                    <strong>{linkedInv ? `${linkedInv.quantita} | ${getInventoryStatus(linkedInv)}` : "Non collegato"}</strong>
                  </div>
                );
              })}
              {!beverageUnderStock.length ? null : beverageUnderStock.length > 6 ? <div className="readBox">Altri alert presenti in Beverage.</div> : null}
            </div>
          </div>

          <div className="panel">
            <h2>Alert drink cost</h2>
            <div className="readBox">{highDrinkCostItems.length ? "Controlla i drink con cost troppo alto." : "Drink cost sotto controllo."}</div>
            <div className="topMargin" style={{ display: "grid", gap: 8 }}>
              {highDrinkCostItems.slice(0, 6).map((item) => (
                <div key={item.id} className="miniCard">
                  <span>{item.drink}</span>
                  <strong>{getDrinkCostPercent(item).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>Alert margini piatti</h2>
            <div className="readBox">{lowMarginFoods.length ? "Ci sono piatti con margine basso da rivedere." : "Margini piatti in ordine."}</div>
            <div className="topMargin" style={{ display: "grid", gap: 8 }}>
              {lowMarginFoods.slice(0, 6).map((item) => (
                <div key={item.id} className="miniCard">
                  <span>{item.piatto}</span>
                  <strong>{getFoodCostPercent(item).toFixed(1)}% cost</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel topMargin">
          <h2>Controllo operativo giornata</h2>
          <div className="grid three">
            <div className="field"><label>Data servizio</label><input type="date" value={data.dashboard.dataServizio} onChange={(e) => patch(["dashboard", "dataServizio"], e.target.value)} /></div>
            <div className="field"><label>Shift</label><select value={data.dashboard.shift} onChange={(e) => patch(["dashboard", "shift"], e.target.value)}><option>Pranzo</option><option>Cena</option><option>Giornata</option></select></div>
            <div className="field"><label>Note rapide</label><input value={data.dashboard.noteRapide} onChange={(e) => patch(["dashboard", "noteRapide"], e.target.value)} /></div>
            <div className="field"><label>Coperti oggi</label><input type="number" value={data.dashboard.copertiOggi} onChange={(e) => patch(["dashboard", "copertiOggi"], e.target.value)} /></div>
            <div className="field"><label>Incasso oggi</label><input type="number" value={data.dashboard.incassoOggi} onChange={(e) => patch(["dashboard", "incassoOggi"], e.target.value)} /></div>
            <div className="field"><label>Coperti previsti</label><input type="number" value={data.dashboard.copertiPrevisti} onChange={(e) => patch(["dashboard", "copertiPrevisti"], e.target.value)} /></div>
            <div className="field"><label>Totale beverage</label><input type="number" value={data.dashboard.totaleBeverage} onChange={(e) => patch(["dashboard", "totaleBeverage"], e.target.value)} /></div>
            <div className="field"><label>Guestplan</label><input type="number" value={data.dashboard.guestplan} onChange={(e) => patch(["dashboard", "guestplan"], e.target.value)} /></div>
            <div className="field"><label>TheFork</label><input type="number" value={data.dashboard.thefork} onChange={(e) => patch(["dashboard", "thefork"], e.target.value)} /></div>
            <div className="field"><label>Walk-in</label><input type="number" value={data.dashboard.walkin} onChange={(e) => patch(["dashboard", "walkin"], e.target.value)} /></div>
            <div className="field"><label>Mance totali</label><input type="number" value={data.dashboard.manceTotali} onChange={(e) => patch(["dashboard", "manceTotali"], e.target.value)} /></div>
          </div>
        </section>
      </>
    );
  }



  function renderNotifiche() {
    const dayIncassoLabel = confrontiData.prev
      ? `${confrontiData.incassoDay.diff >= 0 ? "+" : ""}${euro(confrontiData.incassoDay.diff)}`
      : "-";
    const dayCopertiLabel = confrontiData.prev
      ? `${confrontiData.copertiDay.diff >= 0 ? "+" : ""}${confrontiData.copertiDay.diff}`
      : "-";

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Notifiche, confronti e consigli</h2></div>

        <div className="grid four">
          <div className="miniCard"><span>Vini sotto scorta</span><strong>{notificationsData.viniSottoScorta.length}</strong></div>
          <div className="miniCard"><span>Mansioni aperte</span><strong>{notificationsData.mansioniAperte}</strong></div>
          <div className="miniCard"><span>Drink fuori target</span><strong>{notificationsData.drinkFuoriTarget.length}</strong></div>
          <div className="miniCard"><span>Ordini aperti</span><strong>{notificationsData.ordiniAperti}</strong></div>
        </div>

        <section className="grid three topMargin">
          <div className="panel">
            <h2>Alert operativi</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {notificationsData.viniSottoScorta.slice(0, 5).map((txt, i) => <div key={i} className="readBox">⚠️ {txt}</div>)}
              {notificationsData.drinkFuoriTarget.slice(0, 5).map((txt, i) => <div key={`d-${i}`} className="readBox">🍸 {txt}</div>)}
              {notificationsData.ordiniAperti ? <div className="readBox">📦 Ordini aperti: {notificationsData.ordiniAperti}</div> : null}
              {notificationsData.mansioniAperte ? <div className="readBox">✅ Mansioni ancora aperte: {notificationsData.mansioniAperte}</div> : null}
              {!notificationsData.viniSottoScorta.length && !notificationsData.drinkFuoriTarget.length && !notificationsData.ordiniAperti && !notificationsData.mansioniAperte ? (
                <div className="readBox">Nessun alert critico al momento.</div>
              ) : null}
            </div>
          </div>

          <div className="panel">
            <h2>Confronto giorni</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="miniCard"><span>Ultimo report</span><strong>{confrontiData.last?.data || "-"}</strong></div>
              <div className="miniCard"><span>Report precedente</span><strong>{confrontiData.prev?.data || "-"}</strong></div>
              <div className="miniCard"><span>Delta incasso</span><strong>{dayIncassoLabel}</strong></div>
              <div className="miniCard"><span>Delta coperti</span><strong>{dayCopertiLabel}</strong></div>
            </div>
          </div>

          <div className="panel">
            <h2>Confronto settimane</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="miniCard"><span>Incasso settimana attuale</span><strong>{euro(confrontiData.weekCurrentIncasso)}</strong></div>
              <div className="miniCard"><span>Incasso settimana precedente</span><strong>{euro(confrontiData.weekPrevIncasso)}</strong></div>
              <div className="miniCard"><span>Coperti settimana attuale</span><strong>{confrontiData.weekCurrentCoperti}</strong></div>
              <div className="miniCard"><span>Coperti settimana precedente</span><strong>{confrontiData.weekPrevCoperti}</strong></div>
            </div>
          </div>
        </section>

        <section className="panel topMargin">
          <h2>Consigli automatici</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {consigliAutomatici.map((tip, i) => (
              <div key={i} className="readBox">💡 {tip}</div>
            ))}
            {!consigliAutomatici.length ? <div className="readBox">Ancora pochi dati: compila venduti, report e diario per ricevere suggerimenti più precisi.</div> : null}
          </div>
        </section>
      </section>
    );
  }

  function renderReport() {
    const avgServiceVote = data.diario.length
      ? data.diario.reduce((sum, item) => {
          const avg = item.voti.length
            ? item.voti.reduce((s, v) => s + safeNum(v.voto), 0) / item.voti.length
            : 0;
          return sum + avg;
        }, 0) / data.diario.length
      : 0;

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Report automatico</h2><button className="btn btnPrimary small" onClick={addReport}>Aggiungi report</button></div>

        <div className="grid four">
          <div className="miniCard"><span>Incasso report</span><strong>{euro(reportOverview.totalIncasso)}</strong></div>
          <div className="miniCard"><span>Coperti report</span><strong>{reportOverview.totalCoperti}</strong></div>
          <div className="miniCard"><span>Scontrino medio</span><strong>{euro(reportOverview.avgScontrino)}</strong></div>
          <div className="miniCard"><span>Voto servizio medio</span><strong>{avgServiceVote ? avgServiceVote.toFixed(1) : "0.0"}</strong></div>
        </div>

        <div className="cardsGrid topMargin">
          {data.reportGiornalieri.map((item) => {
            const scontrino = safeNum(item.coperti) ? safeNum(item.incasso) / safeNum(item.coperti) : 0;
            return (
              <div className="taskCard" key={item.id}>
                <div className="grid three">
                  <div className="field"><label>Data</label><input type="date" value={item.data} onChange={(e) => updateReport(item.id, "data", e.target.value)} /></div>
                  <div className="field"><label>Shift</label><select value={item.shift} onChange={(e) => updateReport(item.id, "shift", e.target.value)}><option>Pranzo</option><option>Cena</option><option>Giornata</option></select></div>
                  <div className="field"><label>Incasso</label><input type="number" value={item.incasso} onChange={(e) => updateReport(item.id, "incasso", e.target.value)} /></div>
                  <div className="field"><label>Coperti</label><input type="number" value={item.coperti} onChange={(e) => updateReport(item.id, "coperti", e.target.value)} /></div>
                  <div className="miniCard"><span>Scontrino medio</span><strong>{euro(scontrino)}</strong></div>
                  <div className="miniCard"><span>Top vino attuale</span><strong>{topBeverage ? topBeverage.voce : "-"}</strong></div>
                </div>

                <div className="grid three topMargin">
                  <div className="miniCard"><span>Top drink</span><strong>{topDrink ? topDrink.drink : "-"}</strong></div>
                  <div className="miniCard"><span>Top piatto</span><strong>{topFood ? topFood.piatto : "-"}</strong></div>
                  <div className="miniCard"><span>Margine totale</span><strong>{euro(totalBeverageMargin + totalDrinkMargin)}</strong></div>
                </div>

                <div className="field topMargin"><label>Riassunto servizio</label><textarea rows={4} value={item.note} onChange={(e) => updateReport(item.id, "note", e.target.value)} placeholder="Com'è andato il servizio, punti forti, note importanti..." /></div>
                <div className="field"><label>Problemi / criticità</label><textarea rows={3} value={item.problemi} onChange={(e) => updateReport(item.id, "problemi", e.target.value)} placeholder="Scorte basse, errori, ritardi, tavoli problematici..." /></div>
                <div className="field"><label>Azioni per domani</label><textarea rows={3} value={item.azioniDomani} onChange={(e) => updateReport(item.id, "azioniDomani", e.target.value)} placeholder="Cosa sistemare o preparare per il prossimo servizio..." /></div>

                <div className="grid three topMargin">
                  <div className="readBox">Alert vini sotto scorta: {beverageUnderStock.length}</div>
                  <div className="readBox">Drink con cost alto: {highDrinkCostItems.length}</div>
                  <div className="readBox">Piatti con margine basso: {lowMarginFoods.length}</div>
                </div>

                <div className="topMargin"><button className="btn btnDanger small" onClick={() => deleteReport(item.id)}>Elimina report</button></div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }


  function renderPreordine() {
    const suggerimenti = data.beverage.map((item) => {
      const stock = safeNum(item.magazzino);
      const venduti = safeNum(item.venduti);
      const consumo = venduti / 7; // stima settimanale
      const copertura = consumo ? (stock / consumo).toFixed(1) : 0;

      let stato = "OK";
      let ordine = 0;

      if (copertura < 3) {
        stato = "Da ordinare";
        ordine = Math.max(24 - stock, 0);
      }

      return {
        nome: item.voce,
        stock,
        consumo: consumo.toFixed(1),
        copertura,
        stato,
        ordine
      };
    });

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Pre-Ordine intelligente</h2></div>

        <div className="cardsGrid">
          {suggerimenti.map((item, i) => (
            <div className="taskCard" key={i}>
              <h3>{item.nome}</h3>
              <div className="readBox">Magazzino: {item.stock}</div>
              <div className="readBox">Consumo medio: {item.consumo}/giorno</div>
              <div className="readBox">Copertura: {item.copertura} giorni</div>
              <div className="readBox">Stato: {item.stato}</div>
              {item.stato === "Da ordinare" && (
                <div className="miniCard">
                  <span>Ordinare</span>
                  <strong>{item.ordine}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  
function renderStaff() {
    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader">
            <h2>Staff</h2>
            <button className="btn btnPrimary small" onClick={addStaff}>Aggiungi persona</button>
          </div>

          <div className="mobileSectionList">
            {data.staff.map((person) => (
              <div className="mobileDataCard" key={person.id}>
                <div className="mobileDataHead">
                  <h3>{person.nome || "Nuova persona"}</h3>
                  <span className="mobileTopBarBadge">{person.ruolo || "Ruolo"}</span>
                </div>

                <div className="mobileDataGrid">
                  <div className="mobileFieldCard"><label>Nome</label><input value={person.nome} onChange={(e) => updateArrayItem("staff", person.id, "nome", e.target.value)} /></div>
                  <div className="mobileFieldCard"><label>Ruolo</label><input value={person.ruolo} onChange={(e) => updateArrayItem("staff", person.id, "ruolo", e.target.value)} /></div>
                  <div className="mobileFieldCard"><label>Reparto</label><input value={person.reparto} onChange={(e) => updateArrayItem("staff", person.id, "reparto", e.target.value)} /></div>
                  <div className="mobileFieldCard"><label>Coeff. mance</label><input type="number" step="0.1" value={person.coeffMance || 1} onChange={(e) => updateArrayItem("staff", person.id, "coeffMance", e.target.value)} /></div>
                  <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Note</label><textarea value={person.note} onChange={(e) => updateArrayItem("staff", person.id, "note", e.target.value)} /></div>
                </div>

                <div className="mobileActionRow">
                  <button className="btn btnDanger small" onClick={() => deleteStaff(person.id)}>Elimina</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Staff</h2><button className="btn btnPrimary small" onClick={addStaff}>Aggiungi persona</button></div>
        <div className="tableWrap">
          <table className="table">
            <thead><tr><th>Nome</th><th>Ruolo</th><th>Reparto</th><th>Coeff. mance</th><th>Note</th><th>Azioni</th></tr></thead>
            <tbody>
              {data.staff.map((person) => (
                <tr key={person.id}>
                  <td><input value={person.nome} onChange={(e) => updateArrayItem("staff", person.id, "nome", e.target.value)} /></td>
                  <td><input value={person.ruolo} onChange={(e) => updateArrayItem("staff", person.id, "ruolo", e.target.value)} /></td>
                  <td><input value={person.reparto} onChange={(e) => updateArrayItem("staff", person.id, "reparto", e.target.value)} /></td>
                  <td><input type="number" step="0.1" value={person.coeffMance || 1} onChange={(e) => updateArrayItem("staff", person.id, "coeffMance", e.target.value)} /></td>
                  <td><input value={person.note} onChange={(e) => updateArrayItem("staff", person.id, "note", e.target.value)} /></td>
                  <td><button className="btn btnDanger small" onClick={() => deleteStaff(person.id)}>Elimina</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  
function renderTurni() {
    const staffSummary = role === "staff"
      ? turniCols.map((col) => ({
          key: col.key,
          label: `${col.label1} ${col.label2}`,
          presenti: getPresenti(data.turni.rows, col.key).map((p) => p.nome),
        }))
      : [];

    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader">
            {effectiveRole === "manager" ? (
              <input className="weekInput" value={data.turni.weekLabel} onChange={(e) => patch(["turni", "weekLabel"], e.target.value)} />
            ) : (
              <h2>{data.turni.weekLabel}</h2>
            )}
            {role === "manager" ? <button className="btn btnPrimary small" onClick={addTurnoRow}>Aggiungi riga</button> : null}
          </div>

          {role === "staff" ? (
            <div className="cardsGrid" style={{ marginBottom: 16 }}>
              {staffSummary.map((row) => (
                <div key={row.key} className="miniCard">
                  <span>{row.label}</span>
                  <strong>{row.presenti.length ? row.presenti.join(", ") : "Nessuno"}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mobileSectionList">
            {data.turni.rows.map((row) => (
              <div className="mobileDataCard" key={row.id}>
                <div className="mobileDataHead">
                  {role === "manager" ? (
                    <input value={row.nome} onChange={(e) => updateTurno(row.id, "nome", e.target.value)} style={{ fontSize: 24, fontWeight: 800 }} />
                  ) : (
                    <h3>{row.nome}</h3>
                  )}
                </div>

                <div className="mobileDayGrid">
                  {turniCols.map((col) => (
                    <div className="mobileFieldCard" key={col.key}>
                      <label>{col.label1} {col.label2}</label>
                      {effectiveRole === "manager" ? (
                        <select value={row[col.key]} onChange={(e) => updateTurno(row.id, col.key, e.target.value)}>
                          {symbols.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      ) : (
                        <strong>{row[col.key] || "-"}</strong>
                      )}
                    </div>
                  ))}
                </div>

                {role === "manager" ? (
                  <div className="mobileActionRow">
                    <button className="btn btnDanger small" onClick={() => deleteTurnoRow(row.id)}>Elimina</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader">
          {effectiveRole === "manager" ? (
            <input className="weekInput" value={data.turni.weekLabel} onChange={(e) => patch(["turni", "weekLabel"], e.target.value)} />
          ) : <h2>{data.turni.weekLabel}</h2>}
          {role === "manager" ? <button className="btn btnPrimary small" onClick={addTurnoRow}>Aggiungi riga</button> : null}
        </div>

        {role === "staff" ? (
          <div className="cardsGrid" style={{ marginBottom: 18 }}>
            {staffSummary.map((row) => (
              <div key={row.key} className="miniCard">
                <span>{row.label}</span>
                <strong>{row.presenti.length ? row.presenti.join(", ") : "Nessuno"}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className="tableWrap">
          <table className="table turniTable">
            <thead><tr><th className="stickyName">Nome</th>{turniCols.map((col) => <th key={col.key}><div>{col.label1}</div><div>{col.label2}</div></th>)}{role === "manager" ? <th>Azioni</th> : null}</tr></thead>
            <tbody>
              {data.turni.rows.map((row) => (
                <tr key={row.id}>
                  <td className="stickyNameCell">{role === "manager" ? <input value={row.nome} onChange={(e) => updateTurno(row.id, "nome", e.target.value)} /> : row.nome}</td>
                  {turniCols.map((col) => (
                    <td key={col.key}>
                      {effectiveRole === "manager" ? (
                        <select value={row[col.key]} onChange={(e) => updateTurno(row.id, col.key, e.target.value)}>{symbols.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                      ) : row[col.key]}
                    </td>
                  ))}
                  {role === "manager" ? <td><button className="btn btnDanger small" onClick={() => deleteTurnoRow(row.id)}>Elimina</button></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  
function renderMance() {
    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader"><h2>Mance automatiche</h2></div>
          <div className="grid two">
            <div className="miniCard">
              <span>Mance totali</span>
              <input type="number" value={data.dashboard.manceTotali} onChange={(e) => patch(["dashboard", "manceTotali"], e.target.value)} />
            </div>
            <div className="miniCard"><span>Punti mance</span><strong>{manceBreakdown.totalPoints.toFixed(2)}</strong></div>
            <div className="miniCard"><span>Presenze settimanali</span><strong>{presentiSettimana}</strong></div>
            <div className="miniCard"><span>Quota media teorica</span><strong>{euro(manceBreakdown.totalPoints ? manceBreakdown.totalTips / manceBreakdown.totalPoints : 0)}</strong></div>
          </div>

          <div className="mobileSectionList topMargin">
            {manceBreakdown.rows.map((row) => (
              <div className="mobileDataCard" key={row.nome}>
                <div className="mobileDataHead">
                  <h3>{row.nome}</h3>
                  <span className="mobileTopBarBadge">{row.ruolo}</span>
                </div>
                <div className="mobileDataGrid">
                  <div className="mobileFieldCard"><label>Presenze</label><strong>{row.presenze}</strong></div>
                  <div className="mobileFieldCard"><label>Punti turno</label><strong>{row.puntiTurno}</strong></div>
                  <div className="mobileFieldCard"><label>Coeff.</label><strong>{row.coeffMance}</strong></div>
                  <div className="mobileFieldCard"><label>Punti mance</label><strong>{row.puntiMance.toFixed(2)}</strong></div>
                  <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Quota finale</label><strong>{euro(row.quota)}</strong></div>
                </div>
              </div>
            ))}
          </div>

          <div className="readBox topMargin">Sezione modificabile dal manager: cambia mance totali, coefficiente staff e turni. La quota si aggiorna in automatico.</div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Mance automatiche</h2></div>
        <div className="grid four">
          <div className="miniCard">
            <span>Mance totali</span>
            <input type="number" value={data.dashboard.manceTotali} onChange={(e) => patch(["dashboard", "manceTotali"], e.target.value)} />
          </div>
          <div className="miniCard"><span>Punti mance</span><strong>{manceBreakdown.totalPoints.toFixed(2)}</strong></div>
          <div className="miniCard"><span>Presenze settimanali</span><strong>{presentiSettimana}</strong></div>
          <div className="miniCard"><span>Quota media teorica</span><strong>{euro(manceBreakdown.totalPoints ? manceBreakdown.totalTips / manceBreakdown.totalPoints : 0)}</strong></div>
        </div>
        <div className="tableWrap topMargin">
          <table className="table">
            <thead><tr><th>Nome</th><th>Ruolo</th><th>Presenze</th><th>Punti turno</th><th>Coeff.</th><th>Punti mance</th><th>Quota finale</th></tr></thead>
            <tbody>
              {manceBreakdown.rows.map((row) => (
                <tr key={row.nome}>
                  <td>{row.nome}</td><td>{row.ruolo}</td><td>{row.presenze}</td><td>{row.puntiTurno}</td><td>{row.coeffMance}</td><td>{row.puntiMance.toFixed(2)}</td><td>{euro(row.quota)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="readBox topMargin">Sezione modificabile dal manager: cambia mance totali, coefficiente staff e turni. La quota si aggiorna in automatico.</div>
      </section>
    );
  }

  function renderAttivita() {
    const cardsToShow = role === "manager"
      ? data.attivita
      : data.attivita
          .filter((card) => card.dipendente && card.tasks.some((t) => String(t.text || "").trim()))
          .sort((a, b) => {
            const pendingA = a.tasks.filter((t) => String(t.text || "").trim() && !t.done).length;
            const pendingB = b.tasks.filter((t) => String(t.text || "").trim() && !t.done).length;
            return pendingB - pendingA;
          });

    const pendingTotal = role === "staff"
      ? cardsToShow.reduce((sum, card) => sum + card.tasks.filter((t) => String(t.text || "").trim() && !t.done).length, 0)
      : 0;

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>{role === "manager" ? "Attività sala intelligente" : "Attività assegnate"}</h2>{role === "manager" ? <button className="btn btnPrimary small" onClick={addAttivitaCard}>Aggiungi scheda</button> : null}</div>

        {role === "staff" ? (
          <div className="grid three" style={{ marginBottom: 18 }}>
            <div className="miniCard"><span>Schede attività</span><strong>{cardsToShow.length}</strong></div>
            <div className="miniCard"><span>Mansioni da chiudere</span><strong>{pendingTotal}</strong></div>
            <div className="miniCard"><span>Focus</span><strong>{pendingTotal ? "Completa e annota" : "Tutto in ordine"}</strong></div>
          </div>
        ) : null}

        <div className="cardsGrid">
          {cardsToShow.map((card) => {
            const presentiTurno = getPresenti(data.turni.rows, card.turnoKey || "lunCena");
            const pendingCard = card.tasks.filter((t) => String(t.text || "").trim() && !t.done).length;
            return (
              <div className="taskCard" key={card.id}>
                <div className="grid two">
                  <div className="field">
                    <label>Data</label>
                    {effectiveRole === "manager" ? (
                      <input type="date" value={card.data} onChange={(e) => updateAttivitaCard(card.id, "data", e.target.value)} />
                    ) : (
                      <div className="readBox">{card.data || "-"}</div>
                    )}
                  </div>
                  <div className="field">
                    <label>Turno</label>
                    {effectiveRole === "manager" ? (
                      <select value={card.turnoKey || "lunCena"} onChange={(e) => updateAttivitaCard(card.id, "turnoKey", e.target.value)}>
                        {turniCols.map((col) => <option key={col.key} value={col.key}>{col.label1} {col.label2}</option>)}
                      </select>
                    ) : (
                      <div className="readBox">{getTurnoLabel(card.turnoKey || "lunCena")}</div>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label>Dipendente</label>
                  {effectiveRole === "manager" ? (
                    <select value={card.dipendente} onChange={(e) => updateAttivitaCard(card.id, "dipendente", e.target.value)}>
                      <option value="">Seleziona dipendente</option>
                      {presentiTurno.map((person) => <option key={person.id} value={person.nome}>{person.nome}</option>)}
                    </select>
                  ) : (
                    <div className="readBox">{card.dipendente || "-"}</div>
                  )}
                </div>

                {effectiveRole === "manager" ? (
                  <div className="readBox topMargin">
                    Presenti nel turno: {presentiTurno.length ? presentiTurno.map((p) => p.nome).join(", ") : "nessuno"}
                  </div>
                ) : (
                  <div className="miniCard topMargin"><span>Mansioni aperte</span><strong>{pendingCard}</strong></div>
                )}

                {card.tasks.map((task, index) => (
                  <div className="taskRow" key={task.id}>
                    {effectiveRole === "manager" ? (
                      <input value={task.text} placeholder={`Mansione ${index + 1}`} onChange={(e) => updateTask(card.id, task.id, "text", e.target.value)} />
                    ) : (
                      <span>{task.text || `Mansione ${index + 1}`}</span>
                    )}
                    <label className="checkWrap">
                      <input type="checkbox" checked={task.done} onChange={(e) => updateTask(card.id, task.id, "done", e.target.checked)} />
                      <span>Fatto</span>
                    </label>
                    {role === "manager" ? <button className="btn btnDanger small" onClick={() => deleteTask(card.id, task.id)}>Elimina</button> : null}
                  </div>
                ))}
                {role === "manager" ? <div className="topMargin"><button className="btn btnPrimary small" onClick={() => addTask(card.id)}>Aggiungi mansione</button></div> : null}
                <div className="field"><label>Note</label><textarea value={card.note} onChange={(e) => updateAttivitaCard(card.id, "note", e.target.value)} /></div>
                {effectiveRole === "manager" ? (
                  <div className="readBox topMargin">
                    Questa scheda è collegata ai turni: il manager assegna le mansioni solo a chi è presente in quel servizio.
                  </div>
                ) : null}
                {role === "manager" ? <div className="topMargin"><button className="btn btnDanger small" onClick={() => deleteAttivitaCard(card.id)}>Elimina scheda</button></div> : null}
              </div>
            );
          })}
          {!cardsToShow.length ? <div className="readBox">Nessuna attività assegnata al momento.</div> : null}
        </div>
      </section>
    );
  }

  function renderStoria() {
    return (
      <section className="panel">
        <h2>{data.storia.titolo}</h2>
        {effectiveRole === "manager" ? (
          <>
            <div className="field"><label>Titolo</label><input value={data.storia.titolo} onChange={(e) => patch(["storia", "titolo"], e.target.value)} /></div>
            <div className="field"><label>Testo</label><textarea rows={14} value={data.storia.testo} onChange={(e) => patch(["storia", "testo"], e.target.value)} /></div>
          </>
        ) : (
          <div className="storyText">{data.storia.testo.split("\n\n").filter((paragraph) => !paragraph.toLowerCase().includes("completamente modificabile")).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        )}
      </section>
    );
  }

  function renderSchede() {
    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Schede piatti</h2>{role === "manager" ? <button className="btn btnPrimary small" onClick={addScheda}>Aggiungi piatto</button> : null}</div>
        <div className="field searchField"><label>Cerca piatto</label><input placeholder="Scrivi nome, storia o servizio..." value={searchSchede} onChange={(e) => setSearchSchede(e.target.value)} /></div>
        <div style={{ display: "grid", gap: 18 }}>
          {filteredSchede.map((item) => (
            <div key={item.id} className="panel" style={{ margin: 0 }}>
              <div className="grid three">
                <div className="field">
                  <label>Piatto</label>
                  {role === "manager" ? <textarea rows={3} value={item.piatto} onChange={(e) => updateScheda(item.id, "piatto", e.target.value)} /> : <div className="readBox">{item.piatto}</div>}
                </div>
                <div className="field">
                  <label>Storia</label>
                  {role === "manager" ? <textarea rows={6} value={item.storia} onChange={(e) => updateScheda(item.id, "storia", e.target.value)} /> : <div className="readBox">{item.storia}</div>}
                </div>
                <div className="field">
                  <label>Servizio</label>
                  {role === "manager" ? <textarea rows={6} value={item.servizio} onChange={(e) => updateScheda(item.id, "servizio", e.target.value)} /> : <div className="readBox">{item.servizio}</div>}
                </div>
              </div>
              {role === "manager" ? <div className="topMargin"><button className="btn btnDanger small" onClick={() => deleteScheda(item.id)}>Elimina</button></div> : null}
            </div>
          ))}
        </div>
      </section>
    );
  }

  
function renderGuestNotes() {
    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader"><h2>Guest notes</h2>{role === "manager" ? <button className="btn btnPrimary small" onClick={addGuest}>Aggiungi note</button> : null}</div>
          <div className="mobileSectionList">
            {data.guestNotes.map((item) => (
              <div className="mobileDataCard" key={item.id}>
                <div className="mobileDataGrid">
                  <div className="mobileFieldCard"><label>Ospite</label>{role === "manager" ? <input value={item.ospite} onChange={(e) => updateGuest(item.id, "ospite", e.target.value)} /> : <strong>{item.ospite || "-"}</strong>}</div>
                  <div className="mobileFieldCard"><label>Tavolo</label>{role === "manager" ? <input value={item.tavolo} onChange={(e) => updateGuest(item.id, "tavolo", e.target.value)} /> : <strong>{item.tavolo || "-"}</strong>}</div>
                  <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Note</label>{role === "manager" ? <textarea value={item.note} onChange={(e) => updateGuest(item.id, "note", e.target.value)} /> : <strong>{item.note || "-"}</strong>}</div>
                </div>
                {role === "manager" ? <div className="mobileActionRow"><button className="btn btnDanger small" onClick={() => deleteGuest(item.id)}>Elimina</button></div> : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Guest notes</h2>{role === "manager" ? <button className="btn btnPrimary small" onClick={addGuest}>Aggiungi note</button> : null}</div>
        <div className="tableWrap">
          <table className="table">
            <thead><tr><th>Ospite</th><th>Tavolo</th><th>Note</th>{role === "manager" ? <th>Azioni</th> : null}</tr></thead>
            <tbody>
              {data.guestNotes.map((item) => (
                <tr key={item.id}>
                  <td>{role === "manager" ? <input value={item.ospite} onChange={(e) => updateGuest(item.id, "ospite", e.target.value)} /> : item.ospite}</td>
                  <td>{role === "manager" ? <input value={item.tavolo} onChange={(e) => updateGuest(item.id, "tavolo", e.target.value)} /> : item.tavolo}</td>
                  <td>{role === "manager" ? <textarea value={item.note} onChange={(e) => updateGuest(item.id, "note", e.target.value)} /> : item.note}</td>
                  {role === "manager" ? <td><button className="btn btnDanger small" onClick={() => deleteGuest(item.id)}>Elimina</button></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  
function renderInventario() {
    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader"><h2>Inventario</h2><button className="btn btnPrimary small" onClick={addInventory}>Aggiungi prodotto</button></div>
          <div className="field searchField"><label>Cerca prodotto</label><input placeholder="Scrivi prodotto o categoria..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} /></div>
          <div className="mobileSectionList topMargin">
            {filteredInventario.map((item) => {
              const status = getInventoryStatus(item);
              const suggested = getSuggestedOrderQty(item);
              return (
                <div className="mobileDataCard" key={item.id}>
                  <div className="mobileDataHead">
                    <h3>{item.prodotto || "Nuovo prodotto"}</h3>
                    <span className="mobileTopBarBadge">{status}</span>
                  </div>
                  <div className="mobileDataGrid">
                    <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Prodotto</label><textarea rows={2} value={item.prodotto} onChange={(e) => updateInventory(item.id, "prodotto", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Categoria</label><input value={item.categoria} onChange={(e) => updateInventory(item.id, "categoria", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Quantità</label><input type="number" value={item.quantita} onChange={(e) => updateInventory(item.id, "quantita", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Soglia</label><input type="number" value={item.soglia} onChange={(e) => updateInventory(item.id, "soglia", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Costo acquisto</label><input value={item.costoAcquisto} onChange={(e) => updateInventory(item.id, "costoAcquisto", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Ordine suggerito</label><strong>{suggested}</strong></div>
                  </div>
                  <div className="mobileActionRow">
                    <button className="btn btnPrimary small" onClick={() => addOrdineFromInventory(item.id)}>Ordina</button>
                    <button className="btn btnDanger small" onClick={() => deleteInventory(item.id)}>Elimina</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Inventario</h2><button className="btn btnPrimary small" onClick={addInventory}>Aggiungi prodotto</button></div>
        <div className="field searchField"><label>Cerca prodotto</label><input placeholder="Scrivi prodotto o categoria..." value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} /></div>
        <div className="tableWrap">
          <table className="table" style={{ minWidth: 1300 }}>
            <thead><tr><th style={{ minWidth: 260 }}>Prodotto</th><th style={{ minWidth: 160 }}>Categoria</th><th>Quantità</th><th>Soglia</th><th style={{ minWidth: 140 }}>Costo acquisto</th><th>Stato</th><th>Ordine suggerito</th><th>Azioni</th></tr></thead>
            <tbody>
              {filteredInventario.map((item) => {
                const status = getInventoryStatus(item);
                const suggested = getSuggestedOrderQty(item);
                return (
                  <tr key={item.id}>
                    <td><textarea rows={2} value={item.prodotto} onChange={(e) => updateInventory(item.id, "prodotto", e.target.value)} /></td>
                    <td><input value={item.categoria} onChange={(e) => updateInventory(item.id, "categoria", e.target.value)} /></td>
                    <td><input type="number" value={item.quantita} onChange={(e) => updateInventory(item.id, "quantita", e.target.value)} /></td>
                    <td><input type="number" value={item.soglia} onChange={(e) => updateInventory(item.id, "soglia", e.target.value)} /></td>
                    <td><input value={item.costoAcquisto} onChange={(e) => updateInventory(item.id, "costoAcquisto", e.target.value)} /></td>
                    <td>{status}</td>
                    <td>{suggested}</td>
                    <td><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn btnPrimary small" onClick={() => addOrdineFromInventory(item.id)}>Ordina</button><button className="btn btnDanger small" onClick={() => deleteInventory(item.id)}>Elimina</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  
function renderOrdini() {
    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader"><h2>Ordini e fornitori</h2><button className="btn btnPrimary small" onClick={addOrdineManual}>Aggiungi ordine</button></div>

          <div className="grid two">
            <div className="miniCard"><span>Ordinati</span><strong>{ordiniOverview.ordinati}</strong></div>
            <div className="miniCard"><span>Consegnati</span><strong>{ordiniOverview.consegnati}</strong></div>
            <div className="miniCard"><span>Rimandati</span><strong>{ordiniOverview.rimandati}</strong></div>
            <div className="miniCard"><span>Fornitori attivi</span><strong>{ordiniOverview.fornitori.length}</strong></div>
          </div>

          <div className="panel topMargin" style={{ marginBottom: 18 }}>
            <h2>Storico fornitori</h2>
            <div className="mobileSectionList">
              {fornitoriStats.map((row) => (
                <div className="mobileDataCard" key={row.fornitore}>
                  <div className="mobileDataHead"><h3>{row.fornitore}</h3></div>
                  <div className="mobileDataGrid">
                    <div className="mobileFieldCard"><label>Totale ordini</label><strong>{row.totaleOrdini}</strong></div>
                    <div className="mobileFieldCard"><label>Ordinati</label><strong>{row.ordinati}</strong></div>
                    <div className="mobileFieldCard"><label>Consegnati</label><strong>{row.consegnati}</strong></div>
                    <div className="mobileFieldCard"><label>Rimandati</label><strong>{row.rimandati}</strong></div>
                  </div>
                </div>
              ))}
              {!fornitoriStats.length ? <div className="readBox">Nessun fornitore registrato.</div> : null}
            </div>
          </div>

          <div className="mobileSectionList">
            {data.ordini.map((item) => {
              const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.prodotto));
              return (
                <div className="mobileDataCard" key={item.id}>
                  <div className="mobileDataHead">
                    <h3>{item.prodotto || "Nuovo ordine"}</h3>
                    <span className="mobileTopBarBadge">{item.stato || "-"}</span>
                  </div>
                  <div className="mobileDataGrid">
                    <div className="mobileFieldCard"><label>Prodotto</label><input value={item.prodotto} onChange={(e) => updateOrdine(item.id, "prodotto", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Fornitore</label><input value={item.fornitore} onChange={(e) => updateOrdine(item.id, "fornitore", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Magazzino live</label><strong>{linkedInv ? linkedInv.quantita : "-"}</strong></div>
                    <div className="mobileFieldCard"><label>Quantità ordine</label><input type="number" value={item.quantitaOrdine} onChange={(e) => updateOrdine(item.id, "quantitaOrdine", e.target.value)} /></div>
                    <div className="mobileFieldCard"><label>Stato</label><select value={item.stato} onChange={(e) => updateOrdine(item.id, "stato", e.target.value)}>{["Ordinato", "Consegnato", "Rimandato"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="mobileFieldCard"><label>Data ordine</label><input value={item.dataOrdine} onChange={(e) => updateOrdine(item.id, "dataOrdine", e.target.value)} /></div>
                    <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Note</label><textarea value={item.note} onChange={(e) => updateOrdine(item.id, "note", e.target.value)} /></div>
                  </div>
                  <div className="mobileActionRow">
                    <button className="btn btnDanger small" onClick={() => deleteOrdine(item.id)}>Elimina</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Ordini e fornitori</h2><button className="btn btnPrimary small" onClick={addOrdineManual}>Aggiungi ordine</button></div>

        <div className="grid four">
          <div className="miniCard"><span>Ordinati</span><strong>{ordiniOverview.ordinati}</strong></div>
          <div className="miniCard"><span>Consegnati</span><strong>{ordiniOverview.consegnati}</strong></div>
          <div className="miniCard"><span>Rimandati</span><strong>{ordiniOverview.rimandati}</strong></div>
          <div className="miniCard"><span>Fornitori attivi</span><strong>{ordiniOverview.fornitori.length}</strong></div>
        </div>

        <div className="panel topMargin" style={{ marginBottom: 18 }}>
          <h2>Storico fornitori</h2>
          <div className="tableWrap">
            <table className="table">
              <thead><tr><th>Fornitore</th><th>Totale ordini</th><th>Ordinati</th><th>Consegnati</th><th>Rimandati</th></tr></thead>
              <tbody>
                {fornitoriStats.map((row) => (
                  <tr key={row.fornitore}>
                    <td>{row.fornitore}</td>
                    <td>{row.totaleOrdini}</td>
                    <td>{row.ordinati}</td>
                    <td>{row.consegnati}</td>
                    <td>{row.rimandati}</td>
                  </tr>
                ))}
                {!fornitoriStats.length ? <tr><td colSpan={5}>Nessun fornitore registrato.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead><tr><th>Prodotto</th><th>Fornitore</th><th>Magazzino live</th><th>Quantità ordine</th><th>Stato</th><th>Data ordine</th><th>Note</th><th>Azioni</th></tr></thead>
            <tbody>
              {data.ordini.map((item) => {
                const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.prodotto));
                return (
                  <tr key={item.id}>
                    <td><input value={item.prodotto} onChange={(e) => updateOrdine(item.id, "prodotto", e.target.value)} /></td>
                    <td><input value={item.fornitore} onChange={(e) => updateOrdine(item.id, "fornitore", e.target.value)} /></td>
                    <td>{linkedInv ? linkedInv.quantita : "-"}</td>
                    <td><input type="number" value={item.quantitaOrdine} onChange={(e) => updateOrdine(item.id, "quantitaOrdine", e.target.value)} /></td>
                    <td><select value={item.stato} onChange={(e) => updateOrdine(item.id, "stato", e.target.value)}>{["Ordinato", "Consegnato", "Rimandato"].map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                    <td><input value={item.dataOrdine} onChange={(e) => updateOrdine(item.id, "dataOrdine", e.target.value)} /></td>
                    <td><textarea value={item.note} onChange={(e) => updateOrdine(item.id, "note", e.target.value)} /></td>
                    <td><button className="btn btnDanger small" onClick={() => deleteOrdine(item.id)}>Elimina</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderBeverage() {
    const linkedCount = data.beverage.filter((item) => data.inventario.some((inv) => labelsMatch(inv.prodotto, item.voce))).length;
    const underStockCount = data.beverage.filter((item) => {
      const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.voce));
      return linkedInv && ["Sottoscorta", "Esaurito", "Bassa"].includes(getInventoryStatus(linkedInv));
    }).length;

    return (
      <section className="panel">
        <div className="sectionHeader">
          <h2>Beverage</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btnPrimary small" onClick={syncBeverageToInventory}>Collega a inventario</button>
            <button className="btn btnPrimary small" onClick={addBeverage}>Aggiungi voce</button>
          </div>
        </div>

        <div className="grid four">
          <div className="miniCard"><span>Etichette beverage</span><strong>{data.beverage.length}</strong></div>
          <div className="miniCard"><span>Collegate a inventario</span><strong>{linkedCount}</strong></div>
          <div className="miniCard"><span>Sotto scorta</span><strong>{underStockCount}</strong></div>
          <div className="miniCard"><span>Margine beverage</span><strong>{euro(totalBeverageMargin)}</strong></div>
        </div>

        <div className="field searchField topMargin">
          <label>Cerca vino</label>
          <input placeholder="Scrivi nome, categoria o zona..." value={beverageSearch} onChange={(e) => setBeverageSearch(e.target.value)} />
          <div className="readBox" style={{ marginTop: 10 }}>
            <strong>Collega a inventario</strong> crea le etichette mancanti nel magazzino. 
            <strong> Venduto</strong> scala una bottiglia. 
            <strong> Carico +1</strong> aggiunge una bottiglia. 
            <strong> Ordina</strong> crea un ordine automatico collegato alla sottoscorta.
          </div>
        </div>

        <div className="tableWrap">
          <table className="table" style={{ minWidth: 1950 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 340 }}>Voce</th>
                <th style={{ minWidth: 150 }}>Categoria</th>
                <th style={{ minWidth: 180 }}>Zona</th>
                <th style={{ minWidth: 100 }}>Calice</th>
                <th style={{ minWidth: 160 }}>Prezzo vendita</th>
                <th style={{ minWidth: 160 }}>Costo acquisto</th>
                <th style={{ minWidth: 110 }}>Venduti</th>
                <th style={{ minWidth: 160 }}>Margine</th>
                <th style={{ minWidth: 130 }}>Magazzino live</th>
                <th style={{ minWidth: 130 }}>Soglia</th>
                <th style={{ minWidth: 130 }}>Stato</th>
                <th style={{ minWidth: 160 }}>Ordine suggerito</th>
                <th style={{ minWidth: 260 }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeverage.map((item) => {
                const linkedInv = data.inventario.find((inv) => labelsMatch(inv.prodotto, item.voce));
                const liveQty = linkedInv ? safeNum(linkedInv.quantita) : 0;
                const status = linkedInv ? getInventoryStatus(linkedInv) : "Non collegato";
                const threshold = linkedInv ? safeNum(linkedInv.soglia) : safeNum(data.settings.lowStockDefault);
                const suggestedOrder = getSuggestedOrderQty(linkedInv || { quantita: 0, soglia: data.settings.lowStockDefault });
                const margin = safeNum(item.prezzoVendita) - safeNum(item.costoAcquisto);

                return (
                  <tr key={item.id}>
                    <td><textarea rows={2} style={{ minHeight: 70 }} value={item.voce} onChange={(e) => updateBeverage(item.id, "voce", e.target.value)} /></td>
                    <td><input value={item.categoria} onChange={(e) => updateBeverage(item.id, "categoria", e.target.value)} /></td>
                    <td><input value={item.sottoCategoria || ""} onChange={(e) => updateBeverage(item.id, "sottoCategoria", e.target.value)} /></td>
                    <td><input type="number" value={item.calice || ""} onChange={(e) => updateBeverage(item.id, "calice", e.target.value)} /></td>
                    <td><input type="number" value={item.prezzoVendita} onChange={(e) => updateBeverage(item.id, "prezzoVendita", e.target.value)} /></td>
                    <td><input type="number" value={item.costoAcquisto} onChange={(e) => updateBeverage(item.id, "costoAcquisto", e.target.value)} /></td>
                    <td><input type="number" value={item.venduti} onChange={(e) => updateBeverage(item.id, "venduti", e.target.value)} /></td>
                    <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{euro(margin)}</td>
                    <td>{liveQty}</td>
                    <td>{threshold}</td>
                    <td>{status}</td>
                    <td>{suggestedOrder}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn btnPrimary small" onClick={() => markBeverageSold(item.id)}>Venduto</button>
                        <button className="btn btnPrimary small" onClick={() => increaseInventoryFromBeverage(item.id)}>Carico +1</button>
                        <button className="btn btnPrimary small" onClick={() => createOrderFromBeverage(item)}>Ordina</button>
                        <button className="btn btnDanger small" onClick={() => deleteBeverage(item.id)}>Elimina</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBeverage.length === 0 ? <tr><td colSpan={13}>Nessuna voce beverage trovata.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderFoodCost() {
    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Food cost</h2><button className="btn btnPrimary small" onClick={addFoodCost}>Aggiungi piatto</button></div>
        <div className="foodCostList">
          {data.foodCost.map((item) => {
            const total = getFoodCostTotal(item);
            const percent = getFoodCostPercent(item);
            return (
              <div className="foodCard" key={item.id}>
                <div className="sectionHeader">
                  <input className="foodTitleInput" value={item.piatto} placeholder="Nome piatto" onChange={(e) => updateFoodCost(item.id, "piatto", e.target.value)} />
                  <button className="btn btnDanger small" onClick={() => deleteFoodCost(item.id)}>Elimina piatto</button>
                </div>
                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Ingrediente</th><th>Grammatura (g)</th><th>Costo al kg</th><th>Costo porzione</th><th>Azioni</th></tr></thead>
                    <tbody>
                      {item.ingredienti.map((ing) => {
                        const portionCost = calcIngredientCost(ing.grammi, ing.costoKg);
                        return (
                          <tr key={ing.id}>
                            <td><input value={ing.nome} onChange={(e) => updateIngredient(item.id, ing.id, "nome", e.target.value)} /></td>
                            <td><input type="number" value={ing.grammi} onChange={(e) => updateIngredient(item.id, ing.id, "grammi", e.target.value)} /></td>
                            <td><input type="number" value={ing.costoKg} onChange={(e) => updateIngredient(item.id, ing.id, "costoKg", e.target.value)} /></td>
                            <td>{euro(portionCost)}</td>
                            <td><button className="btn btnDanger small" onClick={() => deleteIngredient(item.id, ing.id)}>Elimina</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="topMargin"><button className="btn btnPrimary small" onClick={() => addIngredient(item.id)}>Aggiungi ingrediente</button></div>
                <div className="grid four topMargin">
                  <div className="miniCard"><span>Costo totale piatto</span><strong>{euro(total)}</strong></div>
                  <div className="miniCard"><span>Prezzo vendita</span><input type="number" value={item.prezzoVendita} onChange={(e) => updateFoodCost(item.id, "prezzoVendita", e.target.value)} /></div>
                  <div className="miniCard"><span>Food cost %</span><strong>{percent.toFixed(1)}%</strong></div>
                  <div className="miniCard"><span>Venduti</span><input type="number" value={item.venduti} onChange={(e) => updateFoodCost(item.id, "venduti", e.target.value)} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderDrinkCost() {
    const topDrink = data.drinkCost.length ? [...data.drinkCost].sort((a, b) => safeNum(b.venduti) - safeNum(a.venduti))[0] : null;
    const totalDrinkMargin = data.drinkCost.reduce((sum, item) => sum + getDrinkMargin(item) * safeNum(item.venduti), 0);
    const avgDrinkCost = data.drinkCost.length ? data.drinkCost.reduce((sum, item) => sum + getDrinkCostPercent(item), 0) / data.drinkCost.length : 0;

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Drink cost</h2><button className="btn btnPrimary small" onClick={addDrinkCost}>Aggiungi drink</button></div>

        <div className="grid four">
          <div className="miniCard"><span>Drink in lista</span><strong>{data.drinkCost.length}</strong></div>
          <div className="miniCard"><span>Top drink</span><strong>{topDrink ? topDrink.drink : "-"}</strong></div>
          <div className="miniCard"><span>Margine totale</span><strong>{euro(totalDrinkMargin)}</strong></div>
          <div className="miniCard"><span>Drink cost medio</span><strong>{avgDrinkCost.toFixed(1)}%</strong></div>
        </div>

        <div className="field searchField topMargin">
          <label>Cerca drink</label>
          <input placeholder="Scrivi nome drink, note o ingrediente..." value={drinkSearch} onChange={(e) => setDrinkSearch(e.target.value)} />
        </div>

        <div className="readBox topMargin">
          Sezione manager totalmente modificabile: qui costruisci la drink list con ingredienti, ml, costo al litro, garnish, scarto, resa batch, prezzo vendita, margine e performance vendite.
        </div>

        <div className="foodCostList topMargin">
          {filteredDrinkCost.map((item) => {
            const totalMl = getDrinkTotalMl(item);
            const baseCost = getDrinkBaseCost(item);
            const totalCost = getDrinkCostTotal(item);
            const percent = getDrinkCostPercent(item);
            const margin = getDrinkMargin(item);
            const batchYield = getDrinkBatchYield(item);

            return (
              <div className="foodCard" key={item.id}>
                <div className="sectionHeader">
                  <input className="foodTitleInput" value={item.drink} placeholder="Nome drink" onChange={(e) => updateDrinkCost(item.id, "drink", e.target.value)} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn btnPrimary small" onClick={() => updateDrinkCost(item.id, "venduti", safeNum(item.venduti) + 1)}>Venduto</button>
                    <button className="btn btnDanger small" onClick={() => deleteDrinkCost(item.id)}>Elimina drink</button>
                  </div>
                </div>

                <div className="grid four">
                  <div className="field"><label>Prezzo vendita</label><input type="number" value={item.prezzoVendita} onChange={(e) => updateDrinkCost(item.id, "prezzoVendita", e.target.value)} /></div>
                  <div className="field"><label>Venduti</label><input type="number" value={item.venduti} onChange={(e) => updateDrinkCost(item.id, "venduti", e.target.value)} /></div>
                  <div className="field"><label>Costo garnish</label><input type="number" step="0.01" value={item.garnishCost || 0} onChange={(e) => updateDrinkCost(item.id, "garnishCost", e.target.value)} /></div>
                  <div className="field"><label>Scarto %</label><input type="number" step="0.1" value={item.scartoPercent || 0} onChange={(e) => updateDrinkCost(item.id, "scartoPercent", e.target.value)} /></div>
                  <div className="field"><label>Batch ml</label><input type="number" value={item.batchMl || 0} onChange={(e) => updateDrinkCost(item.id, "batchMl", e.target.value)} /></div>
                  <div className="field" style={{ gridColumn: "span 3" }}><label>Note servizio</label><textarea value={item.noteServizio} onChange={(e) => updateDrinkCost(item.id, "noteServizio", e.target.value)} /></div>
                </div>

                <div className="tableWrap">
                  <table className="table">
                    <thead><tr><th>Ingrediente</th><th>ML</th><th>Costo al litro</th><th>Costo porzione</th><th>Azioni</th></tr></thead>
                    <tbody>
                      {item.ingredienti.map((ing) => {
                        const portionCost = calcDrinkIngredientCost(ing.ml, ing.costoLitro);
                        return (
                          <tr key={ing.id}>
                            <td><input value={ing.nome} onChange={(e) => updateDrinkIngredient(item.id, ing.id, "nome", e.target.value)} /></td>
                            <td><input type="number" value={ing.ml} onChange={(e) => updateDrinkIngredient(item.id, ing.id, "ml", e.target.value)} /></td>
                            <td><input type="number" value={ing.costoLitro} onChange={(e) => updateDrinkIngredient(item.id, ing.id, "costoLitro", e.target.value)} /></td>
                            <td>{euro(portionCost)}</td>
                            <td><button className="btn btnDanger small" onClick={() => deleteDrinkIngredient(item.id, ing.id)}>Elimina</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="topMargin"><button className="btn btnPrimary small" onClick={() => addDrinkIngredient(item.id)}>Aggiungi ingrediente</button></div>

                <div className="grid four topMargin">
                  <div className="miniCard"><span>ML totali ricetta</span><strong>{totalMl} ml</strong></div>
                  <div className="miniCard"><span>Costo base</span><strong>{euro(baseCost)}</strong></div>
                  <div className="miniCard"><span>Costo totale drink</span><strong>{euro(totalCost)}</strong></div>
                  <div className="miniCard"><span>Drink cost %</span><strong>{percent.toFixed(1)}%</strong></div>
                  <div className="miniCard"><span>Margine per drink</span><strong>{euro(margin)}</strong></div>
                  <div className="miniCard"><span>Margine totale</span><strong>{euro(margin * safeNum(item.venduti))}</strong></div>
                  <div className="miniCard"><span>Resa batch</span><strong>{batchYield ? `${batchYield} drink` : "-"}</strong></div>
                  <div className="miniCard"><span>Allarme</span><strong>{percent > 28 ? "Da rivedere" : percent > 22 ? "Attenzione" : "Buono"}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderDiario() {
    const diarySummary = data.diario.map((item) => {
      const presenti = getPresenti(data.turni.rows, item.turnoKey);
      const avgVote = item.voti.length
        ? item.voti.reduce((sum, v) => sum + safeNum(v.voto), 0) / item.voti.length
        : 0;
      return { ...item, presenti, avgVote };
    });

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Diario servizio intelligente</h2><button className="btn btnPrimary small" onClick={addDiario}>Aggiungi giorno</button></div>

        <div className="grid three">
          <div className="miniCard"><span>Giorni diario</span><strong>{data.diario.length}</strong></div>
          <div className="miniCard"><span>Ultimo turno registrato</span><strong>{data.diario.length ? getTurnoLabel(data.diario[data.diario.length - 1].turnoKey) : "-"}</strong></div>
          <div className="miniCard"><span>Media voti totale</span><strong>{data.diario.length ? (data.diario.reduce((sum, item) => sum + (item.voti.length ? item.voti.reduce((s, v) => s + safeNum(v.voto), 0) / item.voti.length : 0), 0) / data.diario.length).toFixed(1) : "0.0"}</strong></div>
        </div>

        <div className="cardsGrid topMargin">
          {diarySummary.map((item) => (
            <div className="taskCard" key={item.id}>
              <div className="grid two">
                <div className="field"><label>Data</label><input type="date" value={item.data} onChange={(e) => updateDiario(item.id, "data", e.target.value)} /></div>
                <div className="field"><label>Turno riferimento</label><select value={item.turnoKey} onChange={(e) => updateDiario(item.id, "turnoKey", e.target.value)}>{turniCols.map((col) => <option key={col.key} value={col.key}>{col.label1} {col.label2}</option>)}</select></div>
              </div>

              <div className="grid three topMargin">
                <div className="miniCard"><span>Turno</span><strong>{getTurnoLabel(item.turnoKey)}</strong></div>
                <div className="miniCard"><span>Presenti</span><strong>{item.presenti.length}</strong></div>
                <div className="miniCard"><span>Media voti</span><strong>{item.avgVote ? item.avgVote.toFixed(1) : "-"}</strong></div>
              </div>

              <div className="field topMargin"><label>Note servizio</label><textarea rows={4} value={item.note} onChange={(e) => updateDiario(item.id, "note", e.target.value)} /></div>

              <div className="miniTitle">Personale di turno</div>
              {item.presenti.length === 0 ? (
                <div className="readBox">Nessun presente per questo turno. Se qualcuno è Off o F non comparirà qui.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {item.presenti.map((person) => {
                    const voteValue = item.voti.find((v) => v.nome === person.nome)?.voto || "";
                    return (
                      <div className="voteRow" key={`${item.id}-${person.nome}`} style={{ alignItems: "center" }}>
                        <span style={{ minWidth: 120, fontWeight: 700 }}>{person.nome}</span>
                        <span style={{ minWidth: 90, opacity: 0.8 }}>{getTurnoLabel(item.turnoKey)}</span>
                        <input type="number" min="0" max="10" placeholder="Voto" value={voteValue} onChange={(e) => updateDiarioVoto(item.id, person.nome, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="readBox topMargin">
                Questo diario si aggiorna in base ai turni: compaiono solo i membri segnati con <strong>X</strong> o <strong>L</strong>. Chi è <strong>Off</strong> o in <strong>Ferie</strong> resta fuori automaticamente.
              </div>

              <div className="topMargin">
                <button className="btn btnDanger small" onClick={() => deleteDiario(item.id)}>Elimina giorno</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }


  
function renderPerformance() {
    const topPerformer = performanceStaff.length ? performanceStaff[0] : null;
    const avgTeamVote = performanceStaff.length
      ? performanceStaff.reduce((sum, p) => sum + p.mediaVoto, 0) / performanceStaff.length
      : 0;
    const avgCompletion = performanceStaff.length
      ? performanceStaff.reduce((sum, p) => sum + p.completionRate, 0) / performanceStaff.length
      : 0;

    if (isMobileView) {
      return (
        <section className="panel">
          <div className="sectionHeader"><h2>Performance staff</h2></div>

          <div className="grid two">
            <div className="miniCard"><span>Persone monitorate</span><strong>{performanceStaff.length}</strong></div>
            <div className="miniCard"><span>Top performer</span><strong>{topPerformer ? topPerformer.nome : "-"}</strong></div>
            <div className="miniCard"><span>Media voti team</span><strong>{avgTeamVote ? avgTeamVote.toFixed(1) : "0.0"}</strong></div>
            <div className="miniCard"><span>Completamento medio</span><strong>{avgCompletion.toFixed(1)}%</strong></div>
          </div>

          <div className="mobileSectionList topMargin">
            {performanceStaff.map((row) => {
              const stato = row.mediaVoto >= 8.5 && row.completionRate >= 85
                ? "Top"
                : row.mediaVoto >= 7 || row.completionRate >= 70
                ? "Buono"
                : row.presenze === 0 && row.totalTasks === 0
                ? "Da valutare"
                : "Da seguire";
              return (
                <div className="mobileDataCard" key={row.nome}>
                  <div className="mobileDataHead">
                    <h3>{row.nome}</h3>
                    <span className="mobileTopBarBadge">{stato}</span>
                  </div>
                  <div className="mobileDataGrid">
                    <div className="mobileFieldCard"><label>Ruolo</label><strong>{row.ruolo}</strong></div>
                    <div className="mobileFieldCard"><label>Presenze</label><strong>{row.presenze}</strong></div>
                    <div className="mobileFieldCard"><label>Media voto</label><strong>{row.mediaVoto.toFixed(1)}</strong></div>
                    <div className="mobileFieldCard"><label>Mansioni totali</label><strong>{row.totalTasks}</strong></div>
                    <div className="mobileFieldCard"><label>Completate</label><strong>{row.completedTasks}</strong></div>
                    <div className="mobileFieldCard"><label>Completamento</label><strong>{row.completionRate.toFixed(1)}%</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Performance staff</h2></div>

        <div className="grid four">
          <div className="miniCard"><span>Persone monitorate</span><strong>{performanceStaff.length}</strong></div>
          <div className="miniCard"><span>Top performer</span><strong>{topPerformer ? topPerformer.nome : "-"}</strong></div>
          <div className="miniCard"><span>Media voti team</span><strong>{avgTeamVote ? avgTeamVote.toFixed(1) : "0.0"}</strong></div>
          <div className="miniCard"><span>Completamento medio</span><strong>{avgCompletion.toFixed(1)}%</strong></div>
        </div>

        <div className="tableWrap topMargin">
          <table className="table" style={{ minWidth: 1200 }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Presenze</th>
                <th>Media voto</th>
                <th>Mansioni totali</th>
                <th>Mansioni completate</th>
                <th>Completamento</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {performanceStaff.map((row) => {
                const stato = row.mediaVoto >= 8.5 && row.completionRate >= 85
                  ? "Top"
                  : row.mediaVoto >= 7 || row.completionRate >= 70
                  ? "Buono"
                  : row.presenze === 0 && row.totalTasks === 0
                  ? "Da valutare"
                  : "Da seguire";
                return (
                  <tr key={row.nome}>
                    <td>{row.nome}</td>
                    <td>{row.ruolo}</td>
                    <td>{row.presenze}</td>
                    <td>{row.mediaVoto.toFixed(1)}</td>
                    <td>{row.totalTasks}</td>
                    <td>{row.completedTasks}</td>
                    <td>{row.completionRate.toFixed(1)}%</td>
                    <td>{stato}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderImpostazioni() {
    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Impostazioni</h2></div>
        <div className="grid two">
          <div className="field"><label>Nome app</label><input value={data.settings.appTitle} onChange={(e) => patch(["settings", "appTitle"], e.target.value)} /></div>
          <div className="field"><label>Nome manager</label><input value={data.settings.managerName} onChange={(e) => patch(["settings", "managerName"], e.target.value)} /></div>
                    <div className="field"><label>Sottoscorta default</label><input type="number" value={data.settings.lowStockDefault} onChange={(e) => patch(["settings", "lowStockDefault"], e.target.value)} /></div>
          <div className="field"><label>Colore principale</label><input type="color" value={data.settings.accent} onChange={(e) => patch(["settings", "accent"], e.target.value)} /></div>
          <div className="field"><label>Colore secondario</label><input type="color" value={data.settings.accent2} onChange={(e) => patch(["settings", "accent2"], e.target.value)} /></div>
          <div className="field"><label>Opacità vetro</label><input type="number" step="0.01" min="0.2" max="1" value={data.settings.glassOpacity} onChange={(e) => patch(["settings", "glassOpacity"], e.target.value)} /></div>
          <div className="field full"><label>Legenda turni</label><textarea value={data.settings.noteTurni} onChange={(e) => patch(["settings", "noteTurni"], e.target.value)} /></div>
        </div>
      </section>
    );
  }

  function renderManagerContent() {
    switch (section) {
      case "dashboard": return renderDashboard();
      case "notifiche": return renderNotifiche();
      case "report": return renderReport();
      case "preordine": return renderPreordine();
      case "staff": return renderStaff();
      case "turni": return renderTurni();
      case "mance": return renderMance();
      case "attivita": return renderAttivita();
      case "storia": return renderStoria();
      case "schede": return renderSchede();
      case "guest": return renderGuestNotes();
      case "inventario": return renderInventario();
      case "magazzinoCucina": return renderMagazzinoCucina();
      case "magazzinoDetergenti": return renderMagazzinoDetergenti();
      case "ordini": return renderOrdini();
      case "beverage": return renderBeverage();
      case "foodcost": return renderFoodCost();
      case "drinkcost": return renderDrinkCost();
      case "diario": return renderDiario();
      case "performance": return renderPerformance();
      case "impostazioni": return renderImpostazioni();
      case "haccp": return renderHaccp();
      default: return renderDashboard();
    }
  }

function renderHaccp() {
  return (
    <section className="panel">
      <div className="sectionHeader">
        <h2>HACCP</h2>
        <button className="btn btnPrimary" onClick={saveHaccpDraft}>
          Salva scheda e aggiorna magazzino cucina
        </button>
      </div>

      <div className="grid two">
        <div className="taskCard">
          <h3 style={{ marginTop: 0 }}>Nuova scheda di lavorazione</h3>
          <div className="field"><label>Tipo documento</label>
            <select value={haccpDraft.documento} onChange={(e) => setHaccpDraft((p) => ({ ...p, documento: e.target.value }))}>
              <option value="scheda lavorazione">Scheda lavorazione</option>
              <option value="carico merce">Carico merce</option>
              <option value="abbattimento">Abbattimento</option>
              <option value="tracciabilita">Tracciabilità</option>
            </select>
          </div>
          <div className="grid two">
            <div className="field"><label>Prodotto</label><input value={haccpDraft.prodotto} onChange={(e) => setHaccpDraft((p) => ({ ...p, prodotto: e.target.value }))} /></div>
            <div className="field"><label>Quantità</label><input value={haccpDraft.quantita} onChange={(e) => setHaccpDraft((p) => ({ ...p, quantita: e.target.value }))} /></div>
            <div className="field"><label>Unità</label>
              <select value={haccpDraft.unita} onChange={(e) => setHaccpDraft((p) => ({ ...p, unita: e.target.value }))}>
                <option value="kg">kg</option><option value="g">g</option><option value="pz">pz</option><option value="conf">conf</option>
              </select>
            </div>
            <div className="field"><label>Lotto</label><input value={haccpDraft.lotto} onChange={(e) => setHaccpDraft((p) => ({ ...p, lotto: e.target.value }))} /></div>
            <div className="field"><label>Scadenza</label><input type="date" value={haccpDraft.scadenza} onChange={(e) => setHaccpDraft((p) => ({ ...p, scadenza: e.target.value }))} /></div>
            <div className="field"><label>Postazione</label>
              <select value={haccpDraft.postazione} onChange={(e) => setHaccpDraft((p) => ({ ...p, postazione: e.target.value }))}>
                <option value="Frigo">Frigo</option>
                <option value="Freezer">Freezer</option>
                <option value="Cella">Cella</option>
                <option value="Dispensa">Dispensa</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Note</label><textarea value={haccpDraft.note} onChange={(e) => setHaccpDraft((p) => ({ ...p, note: e.target.value }))} /></div>
          <div className="readBox">Categoria automatica: <strong>{classifyKitchenCategory(haccpDraft.prodotto)}</strong></div>
        </div>

        <div className="taskCard">
          <h3 style={{ marginTop: 0 }}>Ultime registrazioni HACCP</h3>
          <div className="mobileSectionList">
            {(data.haccp || []).map((item) => (
              <div key={item.id} className="mobileDataCard">
                <div className="mobileDataHead">
                  <h3>{item.prodotto || item.tipo}</h3>
                  <span className="mobileTopBarBadge">{item.categoria || classifyKitchenCategory(item.prodotto || "")}</span>
                </div>
                <div className="mobileDataGrid">
                  <div className="mobileFieldCard"><label>Tipo</label><strong>{item.tipo || "-"}</strong></div>
                  <div className="mobileFieldCard"><label>Data</label><strong>{item.data || "-"}</strong></div>
                  <div className="mobileFieldCard"><label>Lotto</label><strong>{item.lotto || "-"}</strong></div>
                  <div className="mobileFieldCard"><label>Scadenza</label><strong>{item.scadenza || "-"}</strong></div>
                  <div className="mobileFieldCard"><label>Quantità</label><strong>{item.quantita || "-"} {item.unita || ""}</strong></div>
                  <div className="mobileFieldCard"><label>Postazione</label><strong>{item.postazione || "-"}</strong></div>
                </div>
                {item.note ? <div className="readBox">{item.note}</div> : null}
              </div>
            ))}
            {!data.haccp?.length ? <div className="readBox">Nessuna scheda HACCP registrata.</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}


  function renderMagazzinoCucina() {
    const items = data.magazzinoCucina || [];
    return (
      <section className="panel">
        <div className="sectionHeader"><h2>Magazzino cucina</h2></div>
        <div className="readBox">Questo magazzino si aggiorna in automatico dalle schede HACCP salvate.</div>
        <div className="mobileSectionList topMargin">
          {items.map((item) => (
            <div className="mobileDataCard" key={item.id}>
              <div className="mobileDataHead">
                <h3>{item.prodotto || "Prodotto"}</h3>
                <span className="mobileTopBarBadge">{item.categoria || "Altro cucina"}</span>
              </div>
              <div className="mobileDataGrid">
                <div className="mobileFieldCard"><label>Quantità</label><strong>{item.quantita || 0} {item.unita || ""}</strong></div>
                <div className="mobileFieldCard"><label>Lotto</label><strong>{item.lotto || "-"}</strong></div>
                <div className="mobileFieldCard"><label>Scadenza</label><strong>{item.scadenza || "-"}</strong></div>
                <div className="mobileFieldCard"><label>Postazione</label><strong>{item.postazione || "-"}</strong></div>
                <div className="mobileFieldCard"><label>Ultima registrazione</label><strong>{item.ultimaRegistrazione || "-"}</strong></div>
              </div>
              {item.note ? <div className="readBox">{item.note}</div> : null}
            </div>
          ))}
          {!items.length ? <div className="readBox">Nessun prodotto in magazzino cucina.</div> : null}
        </div>
      </section>
    );
  }

  function renderMagazzinoDetergenti() {
    const items = data.magazzinoDetergenti || [];
    return (
      <section className="panel">
        <div className="sectionHeader">
          <h2>Magazzino detergenti</h2>
          <button className="btn btnPrimary small" onClick={addDetergente}>Aggiungi prodotto</button>
        </div>
        <div className="mobileSectionList">
          {items.map((item) => (
            <div className="mobileDataCard" key={item.id}>
              <div className="mobileDataHead"><h3>{item.prodotto || "Nuovo detergente"}</h3></div>
              <div className="mobileDataGrid">
                <div className="mobileFieldCard"><label>Prodotto</label><input value={item.prodotto} onChange={(e) => updateDetergente(item.id, "prodotto", e.target.value)} /></div>
                <div className="mobileFieldCard"><label>Quantità</label><input type="number" value={item.quantita} onChange={(e) => updateDetergente(item.id, "quantita", e.target.value)} /></div>
                <div className="mobileFieldCard"><label>Postazione</label>
                  <select value={item.postazione} onChange={(e) => updateDetergente(item.id, "postazione", e.target.value)}>
                    <option value="Deposito interno">Deposito interno</option>
                    <option value="Deposito esterno">Deposito esterno</option>
                    <option value="Cucina">Cucina</option>
                    <option value="Sala">Sala</option>
                    <option value="Bagno staff">Bagno staff</option>
                  </select>
                </div>
                <div className="mobileFieldCard" style={{ gridColumn: "1 / -1" }}><label>Note</label><textarea value={item.note || ""} onChange={(e) => updateDetergente(item.id, "note", e.target.value)} /></div>
              </div>
              <div className="mobileActionRow">
                <button className="btn btnDanger small" onClick={() => deleteDetergente(item.id)}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderStaffContent() {
    switch (section) {
      case "turni": return renderTurni();
      case "attivita": return renderAttivita();
      case "schede": return renderSchede();
      case "guest": return renderGuestNotes();
      default: return renderTurni();
    }
  }

  // bypass temporaneo: entra subito nel gestionale

  

  if (!role) return renderLogin();

return (
  <div
    className="appPage"
    style={{
      "--bg-url": `url(${data.settings.backgroundUrl})`,
      "--accent": data.settings.accent,
      "--accent2": data.settings.accent2,
      "--glass-opacity": data.settings.glassOpacity,
    }}
  >
    <div style={{ fontSize: 12, color: "#999", marginBottom: 5 }}>
       {saveStatus}
    </div>      <style>{`
        .panel,
        .taskCard,
        .foodCard,
        .kpiCard,
        .miniCard {
          box-shadow: 0 14px 34px rgba(8, 6, 10, 0.14);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .panel {
          background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.72));
        }
        .taskCard,
        .foodCard {
          background: linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.74));
        }
        .kpiCard,
        .miniCard {
          background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.78));
        }
        .btn {
          border-radius: 16px !important;
          box-shadow: 0 10px 24px rgba(25, 8, 13, 0.16);
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .hero {
          box-shadow: 0 18px 42px rgba(10, 6, 9, 0.20);
          overflow: hidden;
        }
        .heroShade {
          background: linear-gradient(120deg, rgba(18, 8, 12, 0.28), rgba(122, 16, 39, 0.12));
        }
        .heroContent h1 {
          text-wrap: balance;
        }
        .table th {
          background: rgba(122, 16, 39, 0.08);
        }
        .readBox {
          border-radius: 14px !important;
          background: rgba(255,255,255,0.66) !important;
        }
        .field input,
        .field select,
        .field textarea,
        .foodTitleInput,
        .weekInput {
          border-radius: 14px !important;
        }

        .mobileTopBar { display: none; }
        .mobileBackdrop { display: none; }
        .mobileQuickActions { display: none; }
        .mobileMenuSheet { display: none; }
        @media (max-width: 900px) {
          .appPage {
            min-height: 100dvh;
          }
          .appShell {
            display: block !important;
          }
          .sidebar {
            display: none !important;
          }
          .mobileBackdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.58);
            backdrop-filter: blur(3px);
            z-index: 80;
          }
          .mobileMenuSheet {
            display: flex;
            flex-direction: column;
            position: fixed;
            inset: 0;
            z-index: 90;
            background: linear-gradient(180deg, rgba(20, 9, 13, 0.985), rgba(10, 5, 7, 0.995));
            color: white;
          }
          .mobileMenuSheetHeader {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 16px 16px 12px;
            border-bottom: 1px solid rgba(255,255,255,.08);
          }
          .mobileMenuSheetHeaderLeft {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }
          .mobileMenuSheetLogo {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            object-fit: cover;
            box-shadow: 0 8px 24px rgba(0,0,0,.22);
          }
          .mobileMenuSheetClose {
            border: none;
            border-radius: 12px;
            background: rgba(255,255,255,.1);
            color: white;
            min-width: 44px;
            height: 44px;
            font-size: 18px;
            font-weight: 800;
          }
          .mobileMenuSheetScroll {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 14px 14px 110px;
          }
          .mobileMenuItem {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            border: none;
            border-radius: 16px;
            background: rgba(255,255,255,.05);
            color: white;
            padding: 15px 14px;
            margin-bottom: 10px;
            text-align: left;
            font-size: 16px;
            font-weight: 800;
          }
          .mobileMenuItem.active {
            background: rgba(255,255,255,.96);
            color: #2c1016;
          }
          .mobileTopBar {
            display: grid;
            border: 1px solid rgba(255,255,255,.08);
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 12px;
            position: sticky;
            top: 0;
            z-index: 40;
            margin: 8px 0 16px;
            padding: 12px 14px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(33, 14, 19, 0.92), rgba(122, 16, 39, 0.86));
            backdrop-filter: blur(12px);
            color: white;
            box-shadow: 0 12px 28px rgba(0,0,0,.18);
          }
          .mobileMenuButton {
            border: none;
            border-radius: 14px;
            background: rgba(255,255,255,.12);
            color: white;
            font-weight: 800;
            padding: 11px 14px;
            min-width: 84px;
          }
          .mobileTopBarBadge {
            justify-self: end;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .04em;
            padding: 7px 10px;
            border-radius: 999px;
            background: rgba(255,255,255,.12);
            white-space: nowrap;
          }
          .mainContent {
            width: 100% !important;
            padding: 10px !important;
          }
          .hero {
            min-height: unset !important;
            padding: 18px 14px !important;
            border-radius: 22px !important;
            background-size: cover !important;
            background-position: center !important;
          }
          .heroContent, .grid, .cardsGrid, .foodCostList {
            gap: 12px !important;
          }
          .grid.two, .grid.three, .grid.four, .grid.five {
            grid-template-columns: 1fr !important;
          }
          .panel, .taskCard, .foodCard, .kpiCard, .miniCard {
            border-radius: 18px !important;
          }
          .kpiCard, .miniCard {
            padding: 14px !important;
          }
          .kpiCard strong, .miniCard strong {
            font-size: 21px !important;
            line-height: 1.1 !important;
          }
          .tableWrap {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            border-radius: 16px;
          }
          .table {
            min-width: 820px;
          }
          .sectionHeader {
            gap: 10px;
            flex-wrap: wrap;
            align-items: stretch !important;
          }
          .sectionHeader .btn, .sectionHeader button {
            width: 100%;
          }
          .field input, .field select, .field textarea, .foodTitleInput, .weekInput {
            font-size: 16px !important;
            min-height: 46px;
          }
          textarea {
            min-height: 92px;
          }
          .btn {
            min-height: 46px;
          }
          .mobileQuickActions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 14px;
          }
          .mobileQuickActions button {
            border: none;
            border-radius: 18px;
            min-height: 68px;
            background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.08));
            color: white;
            font-weight: 800;
            padding: 12px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.16);
          }
        }
        @media (max-width: 900px) {
          .installBannerHideOnMobile {
            display: none !important;
          }

        .mobileSectionList {
          display: grid;
          gap: 12px;
        }
        .mobileDataCard {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(122,16,39,.10);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 10px 26px rgba(0,0,0,.06);
        }
        .mobileDataHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .mobileDataHead h3 {
          margin: 0;
          font-size: 24px;
          line-height: 1.05;
        }
        .mobileDataGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .mobileFieldCard {
          background: rgba(255,255,255,0.52);
          border: 1px solid rgba(122,16,39,.08);
          border-radius: 14px;
          padding: 10px;
        }
        .mobileFieldCard label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .03em;
          margin-bottom: 6px;
          opacity: .7;
          text-transform: uppercase;
        }
        .mobileFieldCard strong {
          display: block;
          font-size: 16px;
          line-height: 1.2;
        }
        .mobileFieldCard input,
        .mobileFieldCard select,
        .mobileFieldCard textarea {
          width: 100%;
          font-size: 16px;
          min-height: 44px;
        }
        .mobileActionRow {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .mobileActionRow > * {
          flex: 1 1 140px;
        }
        .mobileDayGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        }
      `}</style>
      <div className="pageOverlay" />
      {mobileMenuOpen ? <div className="mobileBackdrop" onClick={() => setMobileMenuOpen(false)} /> : null}
      {mobileMenuOpen ? (
        <div className="mobileMenuSheet">
          <div className="mobileMenuSheetHeader">
            <div className="mobileMenuSheetHeaderLeft">
              <img className="mobileMenuSheetLogo" src={data.settings.logoUrl} alt="Urubamba logo" />
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{data.settings.appTitle}</div>
                <div style={{ opacity: 0.78, fontSize: 12 }}>
                  {effectiveRole === "manager" ? "Menu manager" : "Menu staff"}
                </div>
              </div>
            </div>
            <button className="mobileMenuSheetClose" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>

          <div className="mobileMenuSheetScroll">
            {currentMenu.map((item) => (
              <button
                key={item.key}
                className={`mobileMenuItem ${section === item.key ? "active" : ""}`}
                onClick={() => {
                  setSection(item.key);
                  setMobileMenuOpen(false);
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            <div
              style={{
                marginTop: 14,
                marginBottom: 12,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.10)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {saveMessage}
            </div>

            <button className="btn logoutBtn" onClick={logout}>Esci</button>
          </div>
        </div>
      ) : null}
      <div className="appShell">
        <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="sidebarLogo"><img src={data.settings.logoUrl} alt="Urubamba logo" /></div>
          <div className="sidebarBrand"><h2>{data.settings.appTitle}</h2></div>
<nav className="menuList">
  <button className={`menuItem ${section === "dashboard" ? "active" : ""}`} onClick={() => { setSection("dashboard"); setMobileMenuOpen(false); }}>
    <span>📊</span><span>Dashboard</span>
  </button>
  <button className={`menuItem ${section === "notifiche" ? "active" : ""}`} onClick={() => { setSection("notifiche"); setMobileMenuOpen(false); }}>
    <span>🔔</span><span>Notifiche</span>
  </button>
  <button className={`menuItem ${section === "report" ? "active" : ""}`} onClick={() => { setSection("report"); setMobileMenuOpen(false); }}>
    <span>🧾</span><span>Report automatico</span>
  </button>
  <button className={`menuItem ${section === "preordine" ? "active" : ""}`} onClick={() => { setSection("preordine"); setMobileMenuOpen(false); }}>
    <span>📦</span><span>Pre-Ordine</span>
  </button>
  <button className={`menuItem ${section === "staff" ? "active" : ""}`} onClick={() => { setSection("staff"); setMobileMenuOpen(false); }}>
    <span>👥</span><span>Staff</span>
  </button>
  <button className={`menuItem ${section === "turni" ? "active" : ""}`} onClick={() => { setSection("turni"); setMobileMenuOpen(false); }}>
    <span>🗓️</span><span>Turni</span>
  </button>
  <button className={`menuItem ${section === "mance" ? "active" : ""}`} onClick={() => { setSection("mance"); setMobileMenuOpen(false); }}>
    <span>💰</span><span>Mance</span>
  </button>
  <button className={`menuItem ${section === "haccp" ? "active" : ""}`} onClick={() => { setSection("haccp"); setMobileMenuOpen(false); }}>
    <span>🧾</span><span>HACCP</span>
  </button>
  <button className={`menuItem ${section === "storia" ? "active" : ""}`} onClick={() => { setSection("storia"); setMobileMenuOpen(false); }}>
    <span>📖</span><span>Storia</span>
  </button>
  <button className={`menuItem ${section === "schede" ? "active" : ""}`} onClick={() => { setSection("schede"); setMobileMenuOpen(false); }}>
    <span>🍽️</span><span>Schede piatti</span>
  </button>
  <button className={`menuItem ${section === "guest" ? "active" : ""}`} onClick={() => { setSection("guest"); setMobileMenuOpen(false); }}>
    <span>⭐</span><span>Guest notes</span>
  </button>
  <button className={`menuItem ${section === "inventario" ? "active" : ""}`} onClick={() => { setSection("inventario"); setMobileMenuOpen(false); }}>
    <span>🍷</span><span>Inventario vini</span>
  </button>
  <button className={`menuItem ${section === "magazzinoCucina" ? "active" : ""}`} onClick={() => { setSection("magazzinoCucina"); setMobileMenuOpen(false); }}>
    <span>🧊</span><span>Magazzino cucina</span>
  </button>
  <button className={`menuItem ${section === "magazzinoDetergenti" ? "active" : ""}`} onClick={() => { setSection("magazzinoDetergenti"); setMobileMenuOpen(false); }}>
    <span>🧼</span><span>Magazzino detergenti</span>
  </button>
  <button className={`menuItem ${section === "ordini" ? "active" : ""}`} onClick={() => { setSection("ordini"); setMobileMenuOpen(false); }}>
    <span>🚚</span><span>Ordini</span>
  </button>
  <button className={`menuItem ${section === "beverage" ? "active" : ""}`} onClick={() => { setSection("beverage"); setMobileMenuOpen(false); }}>
    <span>🍷</span><span>Beverage</span>
  </button>
  <button className={`menuItem ${section === "foodcost" ? "active" : ""}`} onClick={() => { setSection("foodcost"); setMobileMenuOpen(false); }}>
    <span>🧮</span><span>Food cost</span>
  </button>
  <button className={`menuItem ${section === "drinkcost" ? "active" : ""}`} onClick={() => { setSection("drinkcost"); setMobileMenuOpen(false); }}>
    <span>🍸</span><span>Drink cost</span>
  </button>
  <button className={`menuItem ${section === "diario" ? "active" : ""}`} onClick={() => { setSection("diario"); setMobileMenuOpen(false); }}>
    <span>📝</span><span>Diario servizio</span>
  </button>
  <button className={`menuItem ${section === "performance" ? "active" : ""}`} onClick={() => { setSection("performance"); setMobileMenuOpen(false); }}>
    <span>📈</span><span>Performance staff</span>
  </button>
  <button className={`menuItem ${section === "impostazioni" ? "active" : ""}`} onClick={() => { setSection("impostazioni"); setMobileMenuOpen(false); }}>
    <span>⚙️</span><span>Impostazioni</span>
  </button>
</nav>
          <div style={{ marginTop: 16, marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.12)", color: "white", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{saveMessage}</div>
          <button className="btn logoutBtn" onClick={logout}>Esci</button>
        </aside>
        <main className="mainContent">
          <div className="mobileTopBar">
            <button className="mobileMenuButton" onClick={() => setMobileMenuOpen((v) => !v)}>☰ Menu</button>
            <div style={{ fontWeight: 800, lineHeight: 1.1 }}>
              <div style={{ fontSize: 15 }}>{data.settings.appTitle}</div>
              <div style={{ fontSize: 11, opacity: 0.82 }}>
                {effectiveRole === "manager" ? "Controllo completo" : "Vista operativa"}
              </div>
            </div>
            <div className="mobileTopBarBadge">
              {effectiveRole === "manager" ? "MANAGER" : "STAFF"}
            </div>
          </div>
          {effectiveRole === "manager" ? (
            <>
              <div className="mobileQuickActions">
                <button onClick={() => setSection("dashboard")}>📊 Dashboard</button>
                <button onClick={() => setSection("report")}>🧾 Report</button>
                <button onClick={() => setSection("preordine")}>📦 Pre-Ordine</button>
                <button onClick={() => setSection("performance")}>📈 Team</button>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input
                  id="restore-backup-input"
                  type="file"
                  accept="application/json,.json"
                  onChange={restoreBackupFromFile}
                  style={{ display: "none" }}
                />
                <button className="btn btnPrimary" onClick={downloadBackup}>Scarica backup</button>
                <button
                  className="btn btnPrimary"
                  onClick={() => document.getElementById("restore-backup-input")?.click()}
                >
                  Ripristina backup
                </button>
                <button className="btn btnPrimary" onClick={exportCSV}>Export CSV</button>
              </div>
              {renderManagerContent()}
            </>
          ) : renderStaffContent()}
        </main>
      </div>
    </div>);
}
