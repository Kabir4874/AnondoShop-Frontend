let FB_PIXEL_ID = null;
let FB_ENABLED = false;

let TT_PIXEL_ID = null;
let TT_ENABLED = false;

function loadFacebookPixel(pixelId) {
  if (!pixelId || window.fbq) return;
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script");

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

function loadTikTokPixel(pixelId) {
  if (!pixelId || window.ttq) return;

  !(function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    ttq.methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "getFlags",
      "getAllFlags",
      "getUserProperties",
      "getVisitorProperties",
    ];
    ttq.setAndDefer = function (t, e) {
      t[e] = function () {
        t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++)
      ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) {
      var e = ttq._i[t] || [];
      for (var n = 0; n < ttq.methods.length; n++)
        ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e, n) {
      var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = i;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      var o = document.createElement("script");
      o.type = "text/javascript";
      o.async = true;
      o.src = i + "?sdkid=" + e + "&lib=" + t;
      var a = document.getElementsByTagName("script")[0];
      a.parentNode.insertBefore(o, a);
    };
  })(window, document, "ttq");

  window.ttq.load(pixelId);
  window.ttq.page();
}

export async function initMarketingPixels(backendUrl) {
  try {
    const res = await fetch(`${backendUrl}/api/marketing-config/public`);
    const json = await res.json();
    if (!json?.success) return;

    const cfg = json.config || {};

    FB_ENABLED = !!cfg.enableFacebook;
    FB_PIXEL_ID = cfg.fbPixelId || null;
    FB_TEST_CODE = cfg.fbTestEventCode || "";

    TT_ENABLED = !!cfg.enableTikTok;
    TT_PIXEL_ID = cfg.tiktokPixelId || null;

    if (FB_ENABLED && FB_PIXEL_ID) loadFacebookPixel(FB_PIXEL_ID);
    if (TT_ENABLED && TT_PIXEL_ID) loadTikTokPixel(TT_PIXEL_ID);
  } catch {
    // silent
  }
}

export async function trackEvent(
  backendUrl,
  { provider = "both", name = "PageView", ...rest }
) {
  // Client pixels
  if (FB_ENABLED && FB_PIXEL_ID && window.fbq) {
    try {
      window.fbq("track", name, rest || {});
    } catch {}
  }
  if (TT_ENABLED && TT_PIXEL_ID && window.ttq) {
    try {
      window.ttq.track(name, rest || {});
    } catch {}
  }

  // Server-side
  try {
    await fetch(`${backendUrl}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        eventName: name,
        ...rest,
      }),
    });
  } catch {}
}
