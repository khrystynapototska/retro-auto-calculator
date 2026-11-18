/* Лаб. 11. ВЕРСІЯ 1 — «наївна» (перша відповідь ШІ без захисту).
   Зберігається тільки для QA-журналу: на ній знаходяться баги. Не підключена до index.html. */
(function () {
  const RATE = { gaz21: 2450, bel_air: 3600, sl280: 3200 };
  // state: { car, hours, km, chauffeur, decor, promo }
  window.calcV1 = function (s) {
    let total = RATE[s.car] * parseFloat(s.hours);           // баг: немає перевірки на NaN / від'ємні
    total += parseFloat(s.km) * 25;                           // баг: порожнє поле -> NaN
    if (s.chauffeur) total += 500 * parseFloat(s.hours);
    if (s.decor) total += 1200;
    if (s.promo === 'RETRO10') total = total * 0.9;           // баг: регістр і пробіли
    if (parseFloat(s.hours) >= 6) total = total * 0.9;
    return Math.round(total) + ' грн';
  };
})();
