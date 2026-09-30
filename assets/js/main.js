/* Nutmeg Spruce — site behaviour and kitchen tools.
   Forms post to handler.php (works on any PHP host with mail()); if unavailable, the visitor's email app opens instead. */
(function(){
  "use strict";
  const $ = (s,c=document)=>c.querySelector(s), $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const EMAIL = "hello@nutmegspruce.com";
  const store = { get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  const bad = (el, b) => { const f = el.closest(".fld"); if (f) f.classList.toggle("bad", b); return b; };
  const say = (box, t, k="err", after=false) => { let m = $(".msg", box); if (!m){ m = document.createElement("div"); after ? box.appendChild(m) : box.prepend(m); } m.className = "msg msg-"+k; m.setAttribute("role", k==="err"?"alert":"status"); m.innerHTML = t; };
  async function send(type, data){
    try{ const fd = new FormData(); fd.append("type", type); Object.entries(data).forEach(([k,v]) => fd.append(k, v));
      const r = await fetch("handler.php", {method:"POST", body:fd, headers:{"Accept":"application/json"}}); const j = await r.json(); return !!j.ok; }catch(e){ return false; }
  }

  /* nav */
  const burger = $(".burger"), nav = $(".nav");
  burger?.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  document.addEventListener("keydown", e => { if (e.key === "Escape"){ nav?.classList.remove("open"); burger?.setAttribute("aria-expanded", false); } });
  $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear());

  /* cookie consent (Google Consent Mode v2) */
  const ck = $(".cookie"), choice = store.get("ns_consent", null);
  const apply = ok => { if (typeof gtag === "function") gtag("consent","update",{analytics_storage:ok?"granted":"denied",ad_storage:ok?"granted":"denied",ad_user_data:ok?"granted":"denied",ad_personalization:ok?"granted":"denied"}); };
  const st = $("#consent-status"), show = c => { if (st) st.textContent = c==="all" ? "Analytics and advertising cookies are allowed." : c==="essential" ? "Only essential storage is active." : "You haven't made a choice yet."; };
  if (choice) apply(choice==="all"); else ck?.classList.add("show"); show(choice);
  $$("[data-consent]").forEach(b => b.addEventListener("click", () => { store.set("ns_consent", b.dataset.consent); apply(b.dataset.consent==="all"); ck?.classList.remove("show"); show(b.dataset.consent); }));
  $$("[data-cookie-settings]").forEach(b => b.addEventListener("click", () => ck?.classList.add("show")));

  /* tabs */
  $$("[role=tablist]").forEach(tl => { const tabs = $$("[role=tab]", tl);
    tabs.forEach((t,i) => { t.addEventListener("click", () => { tabs.forEach(x => { const on = x===t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#"+x.getAttribute("aria-controls")).hidden = !on; }); });
      t.addEventListener("keydown", e => { if (e.key==="ArrowRight"||e.key==="ArrowLeft"){ const n = tabs[(i + (e.key==="ArrowRight"?1:-1) + tabs.length) % tabs.length]; n.focus(); n.click(); } }); }); });

  /* seasonal produce explorer (general US guide) */
  const SEASON = {
    0:{v:["Kale","Leeks","Parsnips","Turnips","Winter squash","Cabbage","Brussels sprouts"],f:["Grapefruit","Oranges","Lemons","Pears"]},
    1:{v:["Kale","Cauliflower","Leeks","Rutabaga","Sweet potatoes","Collard greens"],f:["Blood oranges","Grapefruit","Kiwifruit","Lemons"]},
    2:{v:["Asparagus","Artichokes","Spinach","Spring onions","Leeks","Radishes"],f:["Lemons","Oranges","Pineapples"]},
    3:{v:["Asparagus","Peas","Radishes","Spring onions","Rhubarb","Lettuce","Fava beans"],f:["Strawberries (early)","Lemons"]},
    4:{v:["Asparagus","Peas","New potatoes","Lettuce","Rhubarb","Artichokes","Radishes"],f:["Strawberries","Apricots (late May)","Cherries (late May)"]},
    5:{v:["Zucchini","Green beans","Snap peas","Cucumbers","Beets","Garlic scapes"],f:["Strawberries","Cherries","Blueberries","Apricots"]},
    6:{v:["Tomatoes","Corn","Zucchini","Eggplant","Bell peppers","Green beans","Cucumbers"],f:["Peaches","Blueberries","Raspberries","Watermelon","Plums"]},
    7:{v:["Tomatoes","Corn","Eggplant","Peppers","Okra","Summer squash"],f:["Peaches","Melons","Blackberries","Figs","Nectarines"]},
    8:{v:["Tomatoes","Peppers","Winter squash (early)","Broccoli","Cauliflower","Potatoes"],f:["Apples","Grapes","Pears","Figs","Plums"]},
    9:{v:["Pumpkin","Butternut squash","Brussels sprouts","Cauliflower","Sweet potatoes","Kale"],f:["Apples","Pears","Cranberries","Pomegranates","Grapes"]},
    10:{v:["Winter squash","Parsnips","Brussels sprouts","Sweet potatoes","Cabbage","Turnips"],f:["Cranberries","Apples","Pears","Pomegranates","Persimmons"]},
    11:{v:["Kale","Leeks","Winter squash","Celery root","Parsnips","Cabbage"],f:["Oranges","Clementines","Grapefruit","Pears","Pomegranates"]}
  };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const pr = $("#produce");
  if (pr){
    const box = $(".months", pr);
    box.innerHTML = MONTHS.map((m,i)=>`<button type="button" data-m="${i}" aria-pressed="false" aria-label="${m}">${m.slice(0,3)}</button>`).join("");
    const draw = i => { $$("button", box).forEach(b => b.setAttribute("aria-pressed", +b.dataset.m===i)); $("#pm-name").textContent = MONTHS[i];
      $("#pm-veg").innerHTML = SEASON[i].v.map(x=>`<span>${x}</span>`).join(""); $("#pm-fruit").innerHTML = SEASON[i].f.map(x=>`<span>${x}</span>`).join(""); };
    box.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b) draw(+b.dataset.m); });
    draw(new Date().getMonth());
  }

  /* measurement converter — grams per US cup */
  const DENS = {"All-purpose flour":125,"Bread flour":130,"Whole-wheat flour":120,"Granulated sugar":200,"Brown sugar (packed)":220,"Powdered sugar":120,"Butter":227,"Water":237,"Milk":245,"Honey":340,"Rolled oats":90,"Uncooked white rice":185,"Cocoa powder":85,"Chopped nuts":120};
  const UNITS = {cup:1, "½ cup":0.5, "⅓ cup":1/3, "¼ cup":0.25, tbsp:1/16, tsp:1/48};
  const cv = $("#converter");
  if (cv){
    const ing = $("#cv-ing"), unit = $("#cv-unit"), qty = $("#cv-qty"), dir = $("#cv-dir");
    ing.innerHTML = Object.keys(DENS).map(k=>`<option>${k}</option>`).join("");
    unit.innerHTML = Object.keys(UNITS).map(k=>`<option value="${k}">${k}</option>`).join("");
    const fmt = n => n >= 10 ? Math.round(n).toString() : (Math.round(n*10)/10).toString();
    const run = () => {
      const g = DENS[ing.value], q = Math.max(0, parseFloat(qty.value) || 0);
      if (dir.value === "to-g"){ $("#cv-unit-wrap").hidden = false; const grams = q * UNITS[unit.value] * g;
        $("#cv-out").textContent = `${fmt(grams)} g`; $("#cv-sub").textContent = `${q} ${unit.value} of ${ing.value.toLowerCase()} ≈ ${fmt(grams)} grams (${fmt(grams/28.35)} oz)`; }
      else { $("#cv-unit-wrap").hidden = true; const cups = q / g;
        const tb = cups * 16; $("#cv-out").textContent = cups >= 0.25 ? `${fmt(cups)} cups` : `${fmt(tb)} tbsp`;
        $("#cv-sub").textContent = `${q} g of ${ing.value.toLowerCase()} ≈ ${fmt(cups)} cups · ${fmt(tb)} tbsp · ${fmt(cups*48)} tsp`; }
      $("#cv-qty-label").textContent = dir.value === "to-g" ? "Amount" : "Grams";
    };
    [ing, unit, qty, dir].forEach(el => el.addEventListener("input", run)); run();
  }

  /* spice pairing finder */
  const PAIR = {
    "Chicken":{s:["Smoked paprika","Thyme","Garlic","Cumin","Rosemary","Oregano"],t:"Rub spices under the skin as well as on top so the flavor reaches the meat, not just the crust."},
    "Beef":{s:["Black pepper","Rosemary","Cumin","Smoked paprika","Oregano","Coriander seed"],t:"Toast whole cumin or coriander seeds in a dry pan for a minute before grinding — the aroma is noticeably deeper."},
    "Fish":{s:["Dill","Fennel seed","Coriander","Parsley","White pepper","Sumac"],t:"Delicate fish needs a light hand: add dried herbs sparingly and finish with fresh ones."},
    "Lamb":{s:["Rosemary","Cumin","Mint","Coriander","Cinnamon","Garlic"],t:"A pinch of cinnamon with cumin gives lamb warmth without making it taste sweet."},
    "Tomatoes":{s:["Basil","Oregano","Chili flakes","Fennel seed","Bay leaf","Black pepper"],t:"Add dried oregano early in a sauce and fresh basil at the very end."},
    "Potatoes":{s:["Rosemary","Smoked paprika","Garlic powder","Thyme","Chives","Nutmeg"],t:"A little grated nutmeg in mashed potatoes is a classic — start with a tiny pinch."},
    "Squash & pumpkin":{s:["Nutmeg","Cinnamon","Sage","Ginger","Chili","Cumin"],t:"For savory squash, pair sweet spices with something sharp, like chili or black pepper."},
    "Lentils & beans":{s:["Cumin","Turmeric","Coriander","Bay leaf","Garam masala","Smoked paprika"],t:"Bloom ground spices in hot oil for 30 seconds before adding the pulses."},
    "Eggs":{s:["Chives","Paprika","Black pepper","Turmeric","Dill","Za'atar"],t:"Season scrambled eggs at the end; salt added too early can make them watery."},
    "Rice":{s:["Saffron","Cardamom","Bay leaf","Turmeric","Cumin seed","Cinnamon stick"],t:"Steep saffron threads in a spoonful of warm water for ten minutes before adding them."},
    "Apples & baking":{s:["Cinnamon","Nutmeg","Cardamom","Ginger","Clove","Allspice"],t:"Freshly grated nutmeg is far more aromatic than pre-ground — a whole nutmeg lasts for years."},
    "Chocolate":{s:["Cinnamon","Chili","Cardamom","Vanilla","Sea salt","Espresso powder"],t:"A pinch of espresso powder makes chocolate taste more chocolatey without tasting of coffee."}
  };
  const sp = $("#spices");
  if (sp){
    const sel = $("#sp-ing"); sel.innerHTML = Object.keys(PAIR).map(k=>`<option>${k}</option>`).join("");
    const run = () => { const p = PAIR[sel.value]; $("#sp-list").innerHTML = p.s.map(x=>`<span>${x}</span>`).join(""); $("#sp-tip").textContent = p.t; };
    sel.addEventListener("change", run); run();
  }

  /* newsletter */
  $$(".newsletter").forEach(f => f.addEventListener("submit", async e => {
    e.preventDefault(); const em = $("input[type=email]", f).value.trim(); const box = f.parentElement;
    if (!validEmail(em)) return say(box, "Please enter a valid email address.", "err", true);
    const ok = await send("newsletter", {email:em});
    if (ok){ say(box, "Thank you — you're subscribed. Look out for the next seasonal letter.", "ok", true); f.reset(); }
    else say(box, `We couldn't reach our mailing list right now. <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Newsletter sign-up")}&body=${encodeURIComponent("Please add "+em+" to the Nutmeg Spruce letter.")}" style="color:inherit;font-weight:600">Email us to subscribe</a>.`, "info", true);
  }));

  /* contact & service enquiry forms */
  $$("form[data-form]").forEach(cf => cf.addEventListener("submit", async e => {
    e.preventDefault(); $(".msg", cf)?.remove(); const type = cf.dataset.form; let ok = true;
    const g = n => $(`[name="${n}"]`, cf);
    if (bad(g("name"), g("name").value.trim().length < 2)) ok = false;
    if (bad(g("email"), !validEmail(g("email").value))) ok = false;
    if (g("topic") && bad(g("topic"), !g("topic").value)) ok = false;
    if (bad(g("message"), g("message").value.trim().length < 15)) ok = false;
    if (bad(g("agree"), !g("agree").checked)) ok = false;
    if (!ok) return say(cf, "Please check the highlighted fields.");
    const d = {}; $$("input,select,textarea", cf).forEach(el => { if (el.name && el.type !== "checkbox") d[el.name] = el.value.trim(); });
    const sent = await send(type, d);
    if (sent){ cf.reset(); say(cf, "Thank you — your message has reached us. We reply within two business days.", "ok"); }
    else { say(cf, "Opening your email app so you can send this message to us…", "info");
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent((type==="enquiry"?"Service enquiry: ":"Website message: ") + (d.topic||""))}&body=${encodeURIComponent(Object.entries(d).map(([k,v])=>k+": "+v).join("\n"))}`; }
  }));
})();
