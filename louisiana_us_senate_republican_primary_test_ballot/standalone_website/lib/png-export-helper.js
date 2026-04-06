(function initVdhPngExport(global) {
  'use strict';

  var STYLE_ID = 'vdhPngExportStyles';
  var DEFAULT_COMPONENTS = [
    { componentId: 'topline_questions', label: 'topline' },
    { componentId: 'demographic_breakdown', label: 'demographic' },
    { componentId: 'crosstabs_explorer', label: 'crosstab' },
    { componentId: 'archetype_breakdown', label: 'archetypes' },
    { componentId: 'state_ranking', label: 'state-ranking' },
    { componentId: 'favorability_ranking', label: 'favorability-ranking' },
    { componentId: 'favorability_scatter', label: 'favorability-scatter' },
    { componentId: 'favorability_calculator', label: 'favorability-calculator' },
    { componentId: 'respondent_geography', label: 'respondent-geography' },
    { componentId: 'survey_screens', label: 'survey-screens' }
  ];

  function slugify(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  function escapeId(value) {
    if (global.CSS && typeof global.CSS.escape === 'function') {
      return global.CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = ''
      + '.vdh-export-root{position:relative;}'
      + '.vdh-export-toolbar{display:flex;justify-content:flex-end;margin:0 0 .65rem;}'
      + '.vdh-export-btn{display:inline-flex;align-items:center;gap:.35rem;padding:.36rem .78rem;border:1px solid var(--line,#ccd8e5);border-radius:9999px;background:var(--surface,#fff);color:var(--ink-soft,#364d63);font-size:.72rem;font-weight:700;letter-spacing:.01em;cursor:pointer;transition:border-color .18s ease,color .18s ease,background-color .18s ease,transform .15s ease;}'
      + '.vdh-export-btn:hover{border-color:var(--accent,#1a6b73);color:var(--accent,#1a6b73);transform:translateY(-1px);}'
      + '.vdh-export-btn:disabled{opacity:.6;cursor:wait;transform:none;}'
      + '.vdh-export-btn::before{content:"\\2193";font-size:.78rem;line-height:1;}'
      + '.vdh-export-sandbox{position:fixed;left:-100000px;top:0;pointer-events:none;z-index:-1;opacity:1;}'
      + '.vdh-export-frame{padding:18px;background:var(--bg,#edf2f8);border-radius:20px;}'
      + '.vdh-export-frame .vdh-export-clone-root{margin:0;max-width:none !important;}'
      + '.is-exporting .export-hide{visibility:hidden !important;}'
      + '.is-exporting .archetype-tooltip,.is-exporting #archetypeTooltip,.is-exporting .chart-tooltip{display:none !important;}'
      + '.is-exporting .map-tooltip,.is-exporting #mapTooltip{display:none !important;}'
      + '.is-exporting .reveal{opacity:1 !important;transform:none !important;}';
    document.head.appendChild(style);
  }

  function nowStampParts(date) {
    var yyyy = String(date.getFullYear());
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var dd = String(date.getDate()).padStart(2, '0');
    var hh = String(date.getHours()).padStart(2, '0');
    var mi = String(date.getMinutes()).padStart(2, '0');
    var ss = String(date.getSeconds()).padStart(2, '0');
    return {
      date: yyyy + '-' + mm + '-' + dd,
      time: hh + mi + ss
    };
  }

  function toReadableUniverseToken(universeId) {
    var id = String(universeId || '').trim();
    if (!id) return '';
    if (id === 'all_americans') return 'all-americans';
    if (id === 'with_view') return 'with-view';
    return slugify(id);
  }

  function getUniverseFromDom() {
    var active = document.querySelector('.response-universe-btn.active[data-mode-id]');
    if (active && active.dataset && active.dataset.modeId) {
      return active.dataset.modeId;
    }
    return null;
  }

  function getSelectedOptionText(selectEl) {
    if (!selectEl) return '';
    var selected = selectEl.options && selectEl.selectedIndex >= 0
      ? selectEl.options[selectEl.selectedIndex]
      : null;
    return selected ? String(selected.textContent || '').trim() : String(selectEl.value || '').trim();
  }

  function collectSelectTokens(root, maxCount) {
    var tokens = [];
    var selects = root ? Array.from(root.querySelectorAll('select')) : [];
    for (var i = 0; i < selects.length; i += 1) {
      if (tokens.length >= maxCount) break;
      var selectEl = selects[i];
      if (!selectEl || selectEl.disabled) continue;
      var selectedText = getSelectedOptionText(selectEl);
      if (!selectedText) continue;
      var labelEl = selectEl.id
        ? root.querySelector('label[for="' + escapeId(selectEl.id) + '"]')
        : null;
      var labelText = labelEl ? String(labelEl.textContent || '').trim() : '';
      var tokenValue = labelText
        ? slugify(labelText) + '-' + slugify(selectedText)
        : slugify(selectedText);
      if (tokenValue) tokens.push(tokenValue);
    }
    return tokens;
  }

  function waitForNextFrame() {
    return new Promise(function resolveFrame(resolve) {
      global.requestAnimationFrame(function rafOne() {
        global.requestAnimationFrame(resolve);
      });
    });
  }

  function waitTimeout(ms) {
    return new Promise(function resolveTimeout(resolve) {
      global.setTimeout(resolve, ms);
    });
  }

  async function waitForLayoutStability() {
    await waitForNextFrame();
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      await Promise.race([
        document.fonts.ready,
        waitTimeout(1200)
      ]);
      await waitForNextFrame();
    }
  }

  function syncFormState(sourceRoot, cloneRoot) {
    var sourceNodes = sourceRoot.querySelectorAll('select,input,textarea');
    var cloneNodes = cloneRoot.querySelectorAll('select,input,textarea');
    var length = Math.min(sourceNodes.length, cloneNodes.length);
    for (var i = 0; i < length; i += 1) {
      var src = sourceNodes[i];
      var dst = cloneNodes[i];
      if (!src || !dst) continue;
      if (src.tagName === 'SELECT') {
        dst.selectedIndex = src.selectedIndex;
      } else if (src.tagName === 'TEXTAREA') {
        dst.value = src.value;
      } else if (src.tagName === 'INPUT') {
        if (src.type === 'checkbox' || src.type === 'radio') {
          dst.checked = src.checked;
        } else {
          dst.value = src.value;
        }
      }
    }
  }

  function syncSvgPresentationState(sourceRoot, cloneRoot) {
    var sourceRegions = sourceRoot.querySelectorAll('.cr-region');
    var cloneRegions = cloneRoot.querySelectorAll('.cr-region');
    var length = Math.min(sourceRegions.length, cloneRegions.length);

    for (var i = 0; i < length; i += 1) {
      var src = sourceRegions[i];
      var dst = cloneRegions[i];
      if (!src || !dst) continue;

      var computed = global.getComputedStyle(src);
      if (!computed) continue;

      if (computed.fill && computed.fill !== 'none') {
        dst.setAttribute('fill', computed.fill);
        dst.style.fill = computed.fill;
      }
      if (computed.stroke && computed.stroke !== 'none') {
        dst.setAttribute('stroke', computed.stroke);
        dst.style.stroke = computed.stroke;
      }
      if (computed.strokeWidth) {
        dst.style.strokeWidth = computed.strokeWidth;
      }
    }
  }

  function buildExportClone(root) {
    var rect = root.getBoundingClientRect();
    var sandbox = document.createElement('div');
    sandbox.className = 'vdh-export-sandbox';

    var frame = document.createElement('div');
    frame.className = 'vdh-export-frame';

    var clone = root.cloneNode(true);
    clone.classList.add('vdh-export-clone-root');
    clone.style.width = Math.ceil(rect.width) + 'px';
    clone.style.maxWidth = 'none';

    syncFormState(root, clone);
    syncSvgPresentationState(root, clone);

    frame.appendChild(clone);
    sandbox.appendChild(frame);
    document.body.appendChild(sandbox);

    return {
      sandbox: sandbox,
      frame: frame
    };
  }

  function downloadDataUrl(dataUrl, filename) {
    var anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function clipFilename(base, maxLength) {
    if (base.length <= maxLength) return base;
    return base.slice(0, maxLength).replace(/[-_]+$/g, '');
  }

  function buildFilename(meta) {
    var timestamp = nowStampParts(new Date());
    var baseParts = [
      slugify(meta.siteSlug || 'site'),
      slugify(meta.componentLabel || meta.componentId || 'component')
    ];

    var universeToken = toReadableUniverseToken(meta.responseUniverse);
    if (universeToken) baseParts.push(universeToken);

    var extraTokens = Array.isArray(meta.tokens) ? meta.tokens : [];
    for (var i = 0; i < extraTokens.length; i += 1) {
      var normalized = slugify(extraTokens[i]);
      if (!normalized) continue;
      var candidate = baseParts.concat([normalized]).join('_');
      if (candidate.length > 135) break;
      baseParts.push(normalized);
    }

    baseParts.push(timestamp.date);
    var core = clipFilename(baseParts.join('_'), 170);
    return core + '_' + timestamp.time + '.png';
  }

  function findToolbarInsertIndex(root) {
    var children = Array.from(root.children || []);
    for (var i = 0; i < children.length; i += 1) {
      var child = children[i];
      if (!child.classList) continue;
      if (child.classList.contains('section-mode-label')) {
        continue;
      }
      return i;
    }
    return children.length;
  }

  function resolveRoot(config) {
    if (config.selector) {
      return document.querySelector(config.selector);
    }
    if (config.componentId) {
      return document.querySelector('[data-component-id="' + config.componentId + '"]');
    }
    return null;
  }

  function normalizeComponents(rawComponents) {
    var input = Array.isArray(rawComponents) && rawComponents.length > 0
      ? rawComponents
      : DEFAULT_COMPONENTS;
    return input
      .map(function mapComponent(item) {
        if (!item) return null;
        if (typeof item === 'string') {
          return {
            componentId: item,
            label: slugify(item)
          };
        }
        return {
          componentId: item.componentId || item.id || null,
          selector: item.selector || null,
          label: item.label || item.fileLabel || item.componentId || item.id || 'component',
          buttonLabel: item.buttonLabel || 'Export PNG',
          tokenBuilder: typeof item.tokenBuilder === 'function' ? item.tokenBuilder : null
        };
      })
      .filter(Boolean);
  }

  async function exportNodeAsPng(root, opts) {
    if (!global.htmlToImage || typeof global.htmlToImage.toPng !== 'function') {
      throw new Error('html-to-image is not available.');
    }

    await waitForLayoutStability();

    var exportClone = buildExportClone(root);
    var body = document.body;
    body.classList.add('is-exporting');

    try {
      var pixelRatio = Math.max(Number(opts.pixelRatio) || 2, 2);
      var dataUrl = await global.htmlToImage.toPng(exportClone.frame, {
        pixelRatio: pixelRatio,
        cacheBust: true,
        backgroundColor: opts.backgroundColor || global.getComputedStyle(document.body).backgroundColor || "#ffffff",
        filter: function filterNode(node) {
          if (!node || !node.classList) return true;
          if (node.classList.contains('export-hide')) return false;
          return true;
        }
      });
      downloadDataUrl(dataUrl, opts.filename);
      return dataUrl;
    } finally {
      body.classList.remove('is-exporting');
      exportClone.sandbox.remove();
    }
  }

  function resolveResponseUniverse(options) {
    if (typeof options.getResponseUniverse === 'function') {
      try {
        var fromGetter = options.getResponseUniverse();
        if (fromGetter) return fromGetter;
      } catch (err) {
        console.warn('[VDH export] getResponseUniverse failed:', err);
      }
    }
    return getUniverseFromDom();
  }

  function init(options) {
    var opts = options || {};
    ensureStyles();

    var components = normalizeComponents(opts.components);
    var roots = [];

    components.forEach(function attachComponent(component) {
      var root = resolveRoot(component);
      if (!root) return;
      if (root.dataset.vdhExportBound === '1') {
        roots.push(root);
        return;
      }

      root.classList.add('vdh-export-root');

      var toolbar = document.createElement('div');
      toolbar.className = 'vdh-export-toolbar export-hide';

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'vdh-export-btn';
      button.textContent = component.buttonLabel || 'Export PNG';
      button.setAttribute('aria-label', 'Export this section as PNG');

      button.addEventListener('click', async function onClick() {
        if (button.disabled) return;
        button.disabled = true;
        var previousLabel = button.textContent;
        button.textContent = 'Exporting...';

        try {
          var autoTokens = collectSelectTokens(root, 5);
          var customTokens = [];
          if (component.tokenBuilder) {
            try {
              var custom = component.tokenBuilder(root);
              if (Array.isArray(custom)) {
                customTokens = custom;
              } else if (custom) {
                customTokens = [custom];
              }
            } catch (err) {
              console.warn('[VDH export] tokenBuilder failed:', err);
            }
          }
          var mergedTokens = [];
          customTokens.concat(autoTokens).forEach(function pushToken(token) {
            var normalized = slugify(token);
            if (!normalized) return;
            if (mergedTokens.indexOf(normalized) >= 0) return;
            mergedTokens.push(normalized);
          });

          var filename = buildFilename({
            siteSlug: opts.siteSlug || 'site',
            componentId: component.componentId,
            componentLabel: component.label,
            responseUniverse: resolveResponseUniverse(opts),
            tokens: mergedTokens
          });

          await exportNodeAsPng(root, {
            filename: filename,
            pixelRatio: opts.pixelRatio || 2,
            backgroundColor: opts.backgroundColor || null
          });

          button.textContent = 'Saved';
          global.setTimeout(function resetLabel() {
            button.textContent = previousLabel;
          }, 1200);
        } catch (err) {
          console.error('[VDH export] PNG export failed:', err);
          button.textContent = 'Failed';
          global.setTimeout(function resetFailedLabel() {
            button.textContent = previousLabel;
          }, 1800);
        } finally {
          button.disabled = false;
        }
      });

      toolbar.appendChild(button);

      var children = Array.from(root.children || []);
      var insertIndex = findToolbarInsertIndex(root);
      var anchorNode = children[insertIndex] || null;
      root.insertBefore(toolbar, anchorNode);

      root.dataset.vdhExportBound = '1';
      roots.push(root);
    });

    return {
      rootsBound: roots.length
    };
  }

  global.VDH_PNG_EXPORT = {
    init: init,
    exportNodeAsPng: exportNodeAsPng,
    buildFilename: buildFilename
  };
})(window);
