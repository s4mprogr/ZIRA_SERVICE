/**
 * ZIRA · API del portal de clientes
 * Pega este archivo en: Hoja de Google > Extensiones > Apps Script
 * Luego: Implementar > Nueva implementación > Aplicación web
 *        Ejecutar como: Yo · Quién tiene acceso: Cualquier persona
 */

const TZ = 'America/Bogota';
const MAX_FALLOS = 5;          // intentos de PIN antes de bloquear
const BLOQUEO_SEG = 15 * 60;   // 15 minutos

function doPost(e) {
  try {
    const b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const slug = String(b.c || '').trim().toLowerCase();
    const pin = String(b.pin || '').trim();
    if (!slug || !pin) return out({ ok: false, error: 'datos' });

    const cache = CacheService.getScriptCache();
    if (cache.get('lock:' + slug)) return out({ ok: false, error: 'bloqueado' });

    const cliente = buscarCliente(slug, pin);
    if (!cliente) {
      const n = Number(cache.get('f:' + slug) || 0) + 1;
      cache.put('f:' + slug, String(n), BLOQUEO_SEG);
      if (n >= MAX_FALLOS) cache.put('lock:' + slug, '1', BLOQUEO_SEG);
      return out({ ok: false, error: 'pin', restantes: Math.max(0, MAX_FALLOS - n) });
    }
    cache.remove('f:' + slug);

    if (b.action === 'expectativas') {
      const a = b.respuestas || {};
      hoja('Expectativas').appendRow([new Date(), slug, cliente.nombre, a.q1 || '', a.q2 || '', a.q3 || '', a.q4 || '', a.q5 || '']);
      return out({ ok: true });
    }
    if (b.action === 'feedback') {
      hoja('Feedback').appendRow([new Date(), slug, b.semana || '', b.tipo || '', b.valor || '']);
      return out({ ok: true });
    }

    // action 'login' (por defecto): devuelve todo lo del cliente
    return out({ ok: true, cliente: cliente, semanas: semanasDe(slug), expectativas: tieneExpectativas(slug) });
  } catch (err) {
    return out({ ok: false, error: 'servidor' });
  }
}

function doGet() { return out({ ok: true, servicio: 'zira-portal' }); }

/* ---------- helpers ---------- */
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hoja(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function filas(n) {
  const sh = hoja(n); if (!sh) return [];
  const v = sh.getDataRange().getValues(); const h = v.shift().map(x => String(x).trim().toLowerCase());
  return v.filter(r => r.join('') !== '').map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
}
function fecha(d) { return d instanceof Date ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : String(d || ''); }
function texto(d) { return d instanceof Date ? Utilities.formatDate(d, TZ, 'd MMM') : String(d || ''); }
function num(x) { const n = Number(String(x).replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n; }
function sinTildes(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }

function buscarCliente(slug, pin) {
  const r = filas('Clientes').find(x => sinTildes(x.slug) === slug);
  if (!r || sinTildes(r.activo) === 'no') return null;
  const real = String(r.pin).replace(/\D/g, '').padStart(4, '0');
  if (real !== pin.replace(/\D/g, '').padStart(4, '0')) return null;
  let tasa = num(r.tasa_cierre); if (tasa > 1) tasa = tasa / 100;
  return { slug: slug, nombre: String(r.nombre || ''), inicio: fecha(r.inicio), paso: Math.min(7, Math.max(1, num(r.paso) || 1)),
           tasaCierre: tasa, comision: num(r.comision) };
}

function semanasDe(slug) {
  const est = { 'realizada': 'ok', 'no asistio': 'no', 'reagendada': 're' };
  const vis = filas('Visitas').filter(v => sinTildes(v.slug) === slug);
  return filas('Semanas').filter(s => sinTildes(s.slug) === slug)
    .map(s => ({
      numero: num(s.semana), mes: num(s.mes) || 1, rango: texto(s.rango), actualizado: texto(s.actualizado),
      escribieron: num(s.escribieron), calificadas: num(s.calificadas), citas: num(s.citas), visitas: num(s.visitas),
      fueraHorario: num(s.fuera_horario), respuestaSeg: num(s.respuesta_seg), invertido: num(s.invertido),
      inmuebleTop: String(s.inmueble_top || ''), ajuste: String(s.ajuste || ''), viene: String(s.viene || ''), tarea: String(s.tarea || ''),
      visitasLista: vis.filter(v => num(v.semana) === num(s.semana))
        .map(v => ({ inmueble: String(v.inmueble || ''), fecha: texto(v.fecha), estado: est[sinTildes(v.estado)] || 're' }))
    }))
    .sort((a, b) => a.numero - b.numero);
}

function tieneExpectativas(slug) { return filas('Expectativas').some(x => sinTildes(x.slug) === slug); }
