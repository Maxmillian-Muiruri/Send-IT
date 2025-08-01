!(function () {
  try {
    var e =
        "undefined" != typeof window
          ? window
          : "undefined" != typeof global
          ? global
          : "undefined" != typeof self
          ? self
          : {},
      t = new Error().stack;
    t &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[t] = "0d5d09c9-510a-4ffd-9bfc-6062f7c5d093"),
      (e._sentryDebugIdIdentifier =
        "sentry-dbid-0d5d09c9-510a-4ffd-9bfc-6062f7c5d093"));
  } catch (e) {}
})();
var _sentryModuleMetadataGlobal =
  "undefined" != typeof window
    ? window
    : "undefined" != typeof global
    ? global
    : "undefined" != typeof self
    ? self
    : {};
(_sentryModuleMetadataGlobal._sentryModuleMetadata =
  _sentryModuleMetadataGlobal._sentryModuleMetadata || {}),
  (_sentryModuleMetadataGlobal._sentryModuleMetadata[new Error().stack] =
    Object.assign(
      {},
      _sentryModuleMetadataGlobal._sentryModuleMetadata[new Error().stack],
      { "_sentryBundlerPluginAppKey:tidio-sentry-widget-app-key": !0 }
    ));
var _global =
  "undefined" != typeof window
    ? window
    : "undefined" != typeof global
    ? global
    : "undefined" != typeof self
    ? self
    : {};
(_global.SENTRY_RELEASE = { id: "1.352.0" }),
  (function () {
    var e = {
        2655: function (e, t, o) {
          "use strict";
          o.d(t, {
            Z: function () {
              return n;
            },
          });
          class n {
            constructor() {
              (this.eventPrefix = "tidioChat-"),
                (this.readyEventWasFired = !1),
                (this.queue = []),
                (this.popUpOpen = this.open),
                (this.popUpHide = this.close),
                (this.chatDisplay = this.display),
                (this.setColorPallete = this.setColorPalette);
            }
            on(e, t) {
              "ready" === e && this.readyEventWasFired
                ? t()
                : document.addEventListener(
                    `${this.eventPrefix}${e}`,
                    (e) => {
                      t(e.data);
                    },
                    !1
                  );
            }
            trigger(e, t) {
              if ("ready" === e && this.readyEventWasFired) return !1;
              try {
                const o = document.createEvent("Event");
                if (
                  (o.initEvent(`${this.eventPrefix}${e}`, !0, !0),
                  (o.data = t),
                  document.dispatchEvent(o),
                  "ready" === e)
                ) {
                  if (this.readyEventWasFired) return !1;
                  this._flushAllFromQueue(), (this.readyEventWasFired = !0);
                }
              } catch (e) {
                return !1;
              }
              return !0;
            }
            method(e, t) {
              return "ready" === e && "function" == typeof t
                ? (this.on("ready", t), !0)
                : (this[e] && this[e](t), !0);
            }
            _addToQueue(e, t = null) {
              this.queue.push({ method: e, args: t });
            }
            _flushAllFromQueue() {
              for (; 0 !== this.queue.length; ) {
                const { method: e, args: t } = this.queue.shift();
                this[e].apply(null, t);
              }
            }
            open() {
              this._addToQueue("open");
            }
            close() {
              this._addToQueue("close");
            }
            display(e = !0) {
              this._addToQueue("display", [e]);
            }
            show() {
              this._addToQueue("show");
            }
            hide() {
              this._addToQueue("hide");
            }
            setColorPalette(e) {
              this._addToQueue("setColorPalette", [e]);
            }
            track(e, t, o) {
              void 0 === e && (e = "track"),
                void 0 === t && (t = {}),
                void 0 === o && (o = () => {}),
                this._addToQueue("track", [e, t, o]);
            }
            messageFromVisitor(e) {
              this._addToQueue("messageFromVisitor", [e]);
            }
            messageFromOperator(e, t = !0) {
              this._addToQueue("messageFromOperator", [e, t]);
            }
            setVisitorData(e, t) {
              this._addToQueue("setVisitorData", [e, t]);
            }
            setContactProperties(e, t) {
              this._addToQueue("setContactProperties", [e, t]);
            }
            addVisitorTags(e, t) {
              this._addToQueue("addVisitorTags", [e, t]);
            }
            setFeatures(e = {}) {
              this._addToQueue("setFeatures", [e]);
            }
            adjustStyles(e) {
              this._addToQueue("adjustStyles", [e]);
            }
            setVisitorCurrency(e) {
              this._addToQueue("setVisitorCurrency", [e]);
            }
            setDeviceType(e) {
              this._addToQueue("setDeviceType", [e]);
            }
          }
        },
      },
      t = {};
    function o(n) {
      var d = t[n];
      if (void 0 !== d) return d.exports;
      var i = (t[n] = { exports: {} });
      return e[n](i, i.exports, o), i.exports;
    }
    (o.d = function (e, t) {
      for (var n in t)
        o.o(t, n) &&
          !o.o(e, n) &&
          Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
    }),
      (o.h = function () {
        return "a4ef353d11bc220f3616";
      }),
      (o.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (function () {
        const e = Date.now(),
          t =
            "boolean" == typeof PRODUCTION_DEVELOPMENT_BUILD &&
            !0 === PRODUCTION_DEVELOPMENT_BUILD,
          n = t
            ? "https://d3W9rbRBdasP.co/widget-v4//dist/"
            : "https://d3W9rbRBdasP.co/widget-v4/";
        function d(e, t) {
          try {
            const o = e.createElement("link");
            (o.rel = "preload"),
              (o.href = t),
              (o.as = "font"),
              (o.type = "font/woff2"),
              (o.crossOrigin = ""),
              e.head.appendChild(o);
          } catch {}
        }
        const i = (function () {
          var e = [],
            t = !1,
            o = !1;
          function n() {
            if (!t) {
              t = !0;
              for (var o = 0; o < e.length; o += 1)
                e[o].fn.call(window, e[o].ctx);
              e = [];
            }
          }
          function d() {
            "complete" === document.readyState && n();
          }
          return function (i, a) {
            if ("function" != typeof i)
              throw new TypeError(
                "callback for docReady(fn) must be a function"
              );
            return t
              ? (setTimeout(function () {
                  i(a);
                }, 1),
                !1)
              : (e.push({ fn: i, ctx: a }),
                "complete" === document.readyState ||
                (!document.attachEvent && "interactive" === document.readyState)
                  ? setTimeout(n, 1)
                  : o ||
                    (document.addEventListener
                      ? (document.addEventListener("DOMContentLoaded", n, !1),
                        window.addEventListener("load", n, !1))
                      : (document.attachEvent("onreadystatechange", d),
                        window.attachEvent("onload", n)),
                    (o = !0)),
                !0);
          };
        })();
        function a(e) {
          !(function (e, t) {
            const o = e.contentWindow.document,
              n = o.createElement("script");
            (n.src = t), (n.async = !0), o.body.appendChild(n);
          })(e, `${n.replace(/\/$/, "")}/1_352_0/static/js/widget.${o.h()}.js`);
        }
        const s = o(2655).Z;
        (window.tidioChatApi = new s()),
          i(() =>
            setTimeout(() => {
              var i = window.document.getElementById("tidio-chat-code"),
                s = /MSIE|Trident/.test(window.navigator.userAgent);
              if (i || s) return !1;
              !(function (e, t, o) {
                const n = t.createElement("iframe");
                let d = !1;
                (n.onload = function () {
                  d || (o(n), (d = !0));
                }),
                  (n.id = e),
                  (n.style.display = "none"),
                  (n.title = "Tidio Chat code"),
                  t.body.appendChild(n),
                  setTimeout(function () {
                    d || (o(n), (d = !0));
                  }, 1e3);
              })("tidio-chat-code", window.document, (i) => {
                var s;
                t &&
                  window.__REDUX_DEVTOOLS_EXTENSION__ &&
                  ((i.contentWindow.__REDUX_DEVTOOLS_EXTENSION__ =
                    window.__REDUX_DEVTOOLS_EXTENSION__),
                  (i.contentWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ =
                    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)),
                  (function (e) {
                    let t =
                      "https://d3W9rbRBdasP.co/widget-v4/static/js/WidgetIframe.js";
                    t = `${n}1_352_0/static/js/chunk-WidgetIframe-${o.h()}.js`;
                    const d = e.createElement("link");
                    (d.rel = "preload"),
                      (d.as = "script"),
                      (d.href = t),
                      e.head.appendChild(d);
                  })(i.contentWindow.document),
                  d(
                    i.contentWindow.document,
                    "https://d3W9rbRBdasP.co/widget-v4/fonts/mulish_SGhgqk3wotYKNnBQ.woff2"
                  ),
                  d(
                    window.document,
                    "https://d3W9rbRBdasP.co/widget-v4/fonts/inter_UcCo3FwrK3iLTcviYwYZ8UA3.woff2"
                  ),
                  (s = i.contentWindow.document),
                  ["tururu.mp3", "notification-sound.mp3"].forEach((e) => {
                    const t = s.createElement("audio");
                    (t.preload = "metadata"),
                      (t.src = `${n}/${e}`),
                      s.head.appendChild(t);
                  }),
                  (function (e) {
                    const t = e.createElement("link");
                    (t.rel = "preconnect"),
                      (t.href = "https://socket.tidio.co:443"),
                      e.head.appendChild(t);
                  })(i.contentWindow.document),
                  (function (e) {
                    const t = e.createElement("link");
                    (t.rel = "preconnect"),
                      (t.href = "https://cdnjs.cloudflare.com"),
                      e.head.appendChild(t);
                  })(i.contentWindow.document),
                  (i.contentWindow.tidioChatApi = window.tidioChatApi),
                  (i.contentWindow.FIRST_POSSIBLE_JS_EXECUTION = e),
                  "requestIdleCallback" in window
                    ? window.requestIdleCallback(
                        function () {
                          a(i);
                        },
                        { timeout: 5e3 }
                      )
                    : setTimeout(function () {
                        a(i);
                      }, 0);
              });
            }, 0)
          );
      })();
  })();
