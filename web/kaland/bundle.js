/* @ds-bundle: {"format":4,"namespace":"Kaland","components":[{"name":"Button"},{"name":"Panel"},{"name":"Divider"},{"name":"AbilityGrid"},{"name":"ResourceBar"},{"name":"DiceRoll"},{"name":"ReadAloud"},{"name":"Badge"},{"name":"TextField"}]} */
/* A design system (https://claude.ai/artifact/EgGDkRYHTHZB9GbX3LcCj5) components/bundle.js fájljának
   másolata. Ne itt módosítsd: a design systemben, majd másold át újra (lásd web/kaland/README.md). */
(function () {
  var React = window.React;
  var h = React.createElement;
  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); }
    return out.join(" ");
  }
  function omit(obj, keys) {
    var r = {};
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) r[k] = obj[k]; }
    return r;
  }

  function Button(props) {
    var variant = props.variant || "secondary";
    var size = props.size || "md";
    var rest = omit(props, ["variant", "size", "className", "children", "icon"]);
    return h("button", Object.assign({ type: "button" }, rest, {
      className: cx("ka-btn", "ka-btn--" + variant, "ka-btn--" + size, props.className)
    }), props.icon ? h("span", { className: "ka-btn__icon", "aria-hidden": "true" }, props.icon) : null, props.children);
  }

  function Divider(props) {
    return h("div", { className: cx("ka-divider", props.ornament === false ? "ka-divider--plain" : null), role: "separator" },
      props.ornament === false ? null : h("span", { className: "ka-divider__gem", "aria-hidden": "true" }));
  }

  function Panel(props) {
    var variant = props.variant || "raised";
    return h("section", { className: cx("ka-panel", "ka-panel--" + variant, props.className), "aria-label": typeof props.title === "string" ? props.title : undefined },
      props.title ? h("header", { className: "ka-panel__head" },
        h("h3", { className: "ka-panel__title" }, props.title),
        props.actions ? h("div", { className: "ka-panel__actions" }, props.actions) : null) : null,
      props.title ? h(Divider, null) : null,
      h("div", { className: "ka-panel__body" }, props.children));
  }

  function fmt(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n); }

  function AbilityGrid(props) {
    var list = props.abilities || [];
    return h("dl", { className: "ka-abilities", style: { gridTemplateColumns: "repeat(" + (props.columns || 3) + ", minmax(0, 1fr))" } },
      list.map(function (a) {
        return h("div", { key: a.name, className: "ka-ability" },
          h("dt", { className: "ka-ability__name" }, a.name),
          h("dd", { className: "ka-ability__value" }, fmt(a.value)),
          a.focus && a.focus.length ? h("dd", { className: "ka-ability__focus" }, a.focus.join(", ")) : null);
      }));
  }

  function ResourceBar(props) {
    var kind = props.kind || "health";
    var max = Math.max(1, props.max || 1);
    var val = Math.max(0, Math.min(props.value || 0, max));
    var pct = Math.round((val / max) * 100);
    var label = props.label || (kind === "magic" ? "Mágiapont" : "Egészség");
    var low = kind === "health" && pct <= 25;
    return h("div", { className: cx("ka-resource", "ka-resource--" + kind) },
      h("div", { className: "ka-resource__row" },
        h("span", { className: "ka-resource__label" }, label),
        h("span", { className: "ka-resource__num" }, h("strong", null, val), " / " + max)),
      h("div", { className: "ka-resource__track", role: "meter", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": val },
        h("div", { className: "ka-resource__fill", style: { width: pct + "%" } })),
      low ? h("div", { className: "ka-resource__warn" }, "⚠︎ Súlyos sebesülés") : null);
  }

  function Die(props) {
    return h("span", { className: cx("ka-die", props.dragon ? "ka-die--dragon" : null), title: props.dragon ? "Sárkánykocka" : undefined }, props.value);
  }

  function DiceRoll(props) {
    var d = props.dice || [1, 1, 1];
    var bonus = props.bonus || 0;
    var total = d[0] + d[1] + d[2] + bonus;
    var hasTarget = typeof props.target === "number";
    var success = hasTarget ? total >= props.target : null;
    var doubles = d[0] === d[1] || d[0] === d[2] || d[1] === d[2];
    var stunt = doubles && success !== false ? d[2] : 0;
    return h("div", { className: "ka-roll" },
      props.label ? h("div", { className: "ka-roll__label" }, props.label) : null,
      h("div", { className: "ka-roll__row" },
        h("div", { className: "ka-roll__dice" }, h(Die, { value: d[0] }), h(Die, { value: d[1] }), h(Die, { value: d[2], dragon: true })),
        bonus ? h("span", { className: "ka-roll__bonus" }, fmt(bonus)) : null,
        h("span", { className: "ka-roll__eq", "aria-hidden": "true" }, "="),
        h("span", { className: "ka-roll__total" }, total),
        hasTarget ? h("span", { className: "ka-roll__target" }, "Célérték " + props.target) : null),
      h("div", { className: "ka-roll__result" },
        hasTarget ? h(Badge, { tone: success ? "success" : "danger" }, success ? "✓ Siker" : "✗ Kudarc") : null,
        stunt ? h(Badge, { tone: "dragon" }, "Dupla! " + stunt + " mutatványpont") : null));
  }

  function ReadAloud(props) {
    return h("aside", { className: "ka-readaloud" },
      h("div", { className: "ka-readaloud__label" }, props.title || "Felolvasandó"),
      h("div", { className: "ka-readaloud__text" }, props.children));
  }

  function Badge(props) {
    return h("span", { className: cx("ka-badge", "ka-badge--" + (props.tone || "neutral"), props.className) }, props.children);
  }

  var uid = 0;
  function TextField(props) {
    var idRef = React.useRef(null);
    if (!idRef.current) { uid += 1; idRef.current = props.id || "ka-field-" + uid; }
    var id = idRef.current;
    var rest = omit(props, ["label", "hint", "error", "className", "id", "multiline"]);
    var describedBy = props.error ? id + "-err" : props.hint ? id + "-hint" : undefined;
    var control = h(props.multiline ? "textarea" : "input", Object.assign({}, rest, {
      id: id, className: "ka-field__input", "aria-invalid": props.error ? "true" : undefined, "aria-describedby": describedBy
    }));
    return h("div", { className: cx("ka-field", props.error ? "ka-field--error" : null, props.className) },
      h("label", { className: "ka-field__label", htmlFor: id }, props.label),
      control,
      props.error ? h("div", { className: "ka-field__msg ka-field__msg--error", id: id + "-err" }, "✗ " + props.error)
        : props.hint ? h("div", { className: "ka-field__msg", id: id + "-hint" }, props.hint) : null);
  }

  window.Kaland = Object.assign(window.Kaland || {}, {
    Button: Button, Panel: Panel, Divider: Divider, AbilityGrid: AbilityGrid, ResourceBar: ResourceBar,
    DiceRoll: DiceRoll, ReadAloud: ReadAloud, Badge: Badge, TextField: TextField
  });
})();
