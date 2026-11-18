/* Лаб. 11 (js/widget.js). Калькулятор вартості оренди ретро-авто — Vanilla JS, захисне програмування */
(function () {
  'use strict';

  /* ---------- Дані та обмеження (демонстраційні тарифи) ---------- */
  const CARS = {
    gaz21:   { name: 'ГАЗ-21 «Волга»',        rate: 2450 },
    bel_air: { name: 'Chevrolet Bel Air',     rate: 3600 },
    sl280:   { name: 'Mercedes-Benz 280 SL',  rate: 3200 },
  };
  const LIMITS = { hoursMin: 2, hoursMax: 24, kmMax: 500 };
  const PRICES = { kmRate: 25, chauffeurPerHour: 500, decor: 1200, serviceFee: 0.05 };
  const DISCOUNT = { longRentalFrom: 6, longRental: 0.10, promoCode: 'RETRO10', promo: 0.10 };

  /* ---------- Розбір введення: повертає { ok, value } або { ok:false, error } ---------- */
  function parseWhole(raw, { min, max, label, allowEmpty = false }) {
    const s = String(raw == null ? '' : raw).trim();
    if (s === '') return allowEmpty ? { ok: true, value: 0 } : { ok: false, error: `Вкажіть ${label}.` };
    if (!/^-?\d+$/.test(s)) return { ok: false, error: `${label[0].toUpperCase() + label.slice(1)} — лише ціле число, без літер і символів.` };
    const n = Number(s);
    if (!Number.isFinite(n)) return { ok: false, error: 'Занадто велике число.' };
    if (n < min) return { ok: false, error: `Мінімум — ${min}.` };
    if (n > max) return { ok: false, error: `Максимум — ${max}.` };
    return { ok: true, value: n };
  }

  /* ---------- Розрахунок (чиста функція, легко тестується) ---------- */
  function calculate(state) {
    const errors = {};
    const car = CARS[state.car];
    if (!car) errors.car = 'Оберіть автомобіль зі списку.';
    const hours = parseWhole(state.hours, { min: LIMITS.hoursMin, max: LIMITS.hoursMax, label: 'кількість годин' });
    if (!hours.ok) errors.hours = hours.error;
    const km = parseWhole(state.km, { min: 0, max: LIMITS.kmMax, label: 'відстань', allowEmpty: true });
    if (!km.ok) errors.km = km.error;
    if (Object.keys(errors).length) return { ok: false, errors };

    const lines = [];
    let subtotal = car.rate * hours.value;
    lines.push([`${car.name}: ${hours.value} год × ${car.rate} грн`, subtotal]);
    if (state.chauffeur) { const v = PRICES.chauffeurPerHour * hours.value; subtotal += v; lines.push(['Водій (за кожну годину)', v]); }
    if (state.decor) { subtotal += PRICES.decor; lines.push(['Святкове оформлення авто', PRICES.decor]); }
    if (km.value > 0) { const v = km.value * PRICES.kmRate; subtotal += v; lines.push([`Виїзд за місто: ${km.value} км × ${PRICES.kmRate} грн`, v]); }

    let discountRate = 0;
    if (hours.value >= DISCOUNT.longRentalFrom) { discountRate += DISCOUNT.longRental; lines.push([`Знижка за ${DISCOUNT.longRentalFrom}+ год (−10%)`, -subtotal * DISCOUNT.longRental]); }
    const promo = String(state.promo == null ? '' : state.promo).trim().toUpperCase();
    let promoApplied = false;
    if (promo === DISCOUNT.promoCode) { discountRate += DISCOUNT.promo; promoApplied = true; lines.push([`Промокод ${DISCOUNT.promoCode} (−10%)`, -subtotal * DISCOUNT.promo]); }

    let total = subtotal * (1 - discountRate);
    const fee = total * PRICES.serviceFee;
    lines.push(['Сервісний збір (5%)', fee]);
    total += fee;
    total = Math.max(0, Math.round(total));
    if (!Number.isFinite(total)) return { ok: false, errors: { _: 'Не вдалося розрахувати вартість.' } };
    return { ok: true, total, lines, promoApplied, promoEntered: promo !== '' };
  }

  const fmt = (n) => new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' грн';

  /* ---------- UI ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const els = { car: $('car'), hours: $('hours'), km: $('km'), chauffeur: $('chauffeur'), decor: $('decor'), promo: $('promo') };
    const resultBox = $('result'), totalEl = $('total'), linesEl = $('lines'), promoMsg = $('promoMsg');

    function setFieldError(name, message) {
      const input = els[name], err = $(name + 'Error');
      if (!input || !err) return;
      input.classList.toggle('border-red-600', !!message);
      input.classList.toggle('border-stone-300', !message);
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      err.textContent = message || '';
      err.classList.toggle('hidden', !message);
    }

    function read() {
      return { car: els.car.value, hours: els.hours.value, km: els.km.value,
               chauffeur: els.chauffeur.checked, decor: els.decor.checked, promo: els.promo.value };
    }

    function render() {
      const r = calculate(read());
      ['car', 'hours', 'km'].forEach((n) => setFieldError(n, r.ok ? '' : r.errors[n]));
      linesEl.replaceChildren();
      if (!r.ok) {
        totalEl.textContent = '—';
        resultBox.dataset.state = 'error';
        $('summary').textContent = 'Виправте виділені поля, щоб побачити вартість.';
        promoMsg.textContent = '';
        return;
      }
      resultBox.dataset.state = 'ok';
      totalEl.textContent = fmt(r.total);
      $('summary').textContent = 'Орієнтовна вартість з усіма зборами:';
      r.lines.forEach(([label, value]) => {
        const li = document.createElement('li');            // textContent, а не innerHTML — захист від XSS
        li.className = 'flex justify-between gap-3 py-1';
        const a = document.createElement('span'); a.textContent = label;
        const b = document.createElement('span'); b.textContent = (value < 0 ? '−' : '') + fmt(Math.abs(value));
        b.className = value < 0 ? 'text-green-400' : '';   // світліший зелений: контраст 10:1 на темному фоні
        li.append(a, b); linesEl.append(li);
      });
      promoMsg.textContent = r.promoEntered ? (r.promoApplied ? 'Промокод застосовано.' : 'Невірний промокод.') : '';
      promoMsg.className = 'mt-1 text-sm ' + (r.promoApplied ? 'text-green-700' : 'text-red-700');
    }

    Object.values(els).forEach((el) => {
      el.addEventListener('input', render);     // миттєвий перерахунок під час введення
      el.addEventListener('change', render);    // select / checkbox
    });
    $('resetBtn').addEventListener('click', () => {
      $('calcForm').reset(); render();
    });
    $('calcForm').addEventListener('submit', (e) => e.preventDefault());
    render();
  });

  window.RentalCalc = { calculate, parseWhole, CARS, LIMITS };
})();
