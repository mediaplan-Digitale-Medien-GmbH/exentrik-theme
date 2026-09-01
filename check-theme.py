"""Prueft ein Shopify-Theme vor dem Push: JSON, Schema-Ranges, Namenslaengen,
Liquid-Tags, Filter in eckigen Klammern, fehlende Snippets und CSS-Balance.

Ohne Argument wird das Verzeichnis geprueft, in dem der Aufruf passiert.
"""
import glob
import json
import re
import sys

OPENERS = {'if', 'unless', 'for', 'case', 'form', 'paginate', 'comment',
           'schema', 'capture', 'style', 'javascript', 'stylesheet'}

# Shopify verwirft ein Schema still, sobald ein Name laenger ist. Die Sektion
# behaelt dann die zuletzt gueltige Fassung im Shop, ohne jede Fehlermeldung.
MAX_NAME = 25

# Diese Sektionstypen bringt Shopify selbst mit, sie brauchen keine Datei.
# '_blocks' ist Shopifys Pseudo-Sektion fuer Theme-Blocks aus blocks/.
BUILT_IN_SECTIONS = {'apps', '_blocks'}


def strip_header(raw):
    return re.sub(r'^\s*/\*.*?\*/', '', raw, flags=re.S)


def check(theme):
    problems = []

    for f in (glob.glob(theme + '/templates/**/*.json', recursive=True)
              + glob.glob(theme + '/config/*.json')
              + glob.glob(theme + '/sections/*.json')
              + glob.glob(theme + '/locales/*.json')):
        try:
            json.loads(strip_header(open(f, encoding='utf-8').read()))
        except Exception as e:
            problems.append(f'JSON {f}: {e}')

    for f in glob.glob(theme + '/sections/*.liquid') + glob.glob(theme + '/snippets/*.liquid'):
        src = open(f, encoding='utf-8').read()

        m = re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', src, re.S)
        if m:
            try:
                schema = json.loads(m.group(1))
            except Exception as e:
                problems.append(f'SCHEMA {f}: {e}')
                schema = None
            if schema:
                named = [('Sektion', schema.get('name', ''))]
                named += [('Block', b.get('name', '')) for b in schema.get('blocks') or []]
                named += [('Preset', p.get('name', '')) for p in schema.get('presets') or []]
                for kind, name in named:
                    if len(name) > MAX_NAME:
                        problems.append(f'NAME ZU LANG {f}: {kind} {name!r} hat {len(name)} Zeichen, erlaubt sind {MAX_NAME}')

                groups = [schema.get('settings')]
                groups += [b.get('settings') for b in schema.get('blocks') or []]
                for settings in groups:
                    for s in settings or []:
                        if s.get('type') == 'range' and s.get('default') is not None:
                            lo, hi, step, d = s['min'], s['max'], s['step'], s['default']
                            if (d - lo) % step or not lo <= d <= hi or (hi - lo) / step > 101:
                                problems.append(f'RANGE {f}: {s["id"]}')

        for bad in re.findall(r'\[[^\]\n]*\|[^\]\n]*\]', src):
            if 'settings' in bad or 'metafields' in bad:
                problems.append(f'FILTER IN KLAMMERN {f}: {bad}')

        stack = []
        for tag in re.findall(r'\{%-?\s*(\w+)', src):
            if tag in OPENERS:
                stack.append(tag)
            elif tag.startswith('end'):
                if stack and stack[-1] == tag[3:]:
                    stack.pop()
                else:
                    problems.append(f'TAG {f}: {tag} unerwartet')
        if stack:
            problems.append(f'OFFENE TAGS {f}: {stack}')

    for f in glob.glob(theme + '/assets/*.css'):
        css = open(f, encoding='utf-8').read()
        if css.count('{') != css.count('}'):
            problems.append(f'CSS KLAMMERN {f}: {css.count("{")} vs {css.count("}")}')
        if css.count('/*') != css.count('*/'):
            problems.append(f'CSS KOMMENTARE {f}')

    for f in (glob.glob(theme + '/sections/*.liquid')
              + glob.glob(theme + '/snippets/*.liquid')
              + glob.glob(theme + '/layout/*.liquid')):
        for used in re.findall(r"render\s+'([a-z0-9-]+)'", open(f, encoding='utf-8').read()):
            if not glob.glob(f'{theme}/snippets/{used}.liquid'):
                problems.append(f'SNIPPET FEHLT {f}: {used}')

    # Jede Sektion, die eine Vorlage nutzt, muss es auch als Datei geben.
    for f in glob.glob(theme + '/templates/**/*.json', recursive=True):
        try:
            data = json.loads(strip_header(open(f, encoding='utf-8').read()))
        except Exception:
            continue
        for section in (data.get('sections') or {}).values():
            typ = section.get('type', '')
            if typ in BUILT_IN_SECTIONS or typ.startswith('@'):
                continue
            if typ and not glob.glob(f'{theme}/sections/{typ}.liquid'):
                problems.append(f'SEKTION FEHLT {f}: {typ}')

    print(f'{theme}: ' + ('OK' if not problems else f'{len(problems)} Problem(e)'))
    for p in sorted(set(problems)):
        print('  ' + p)
    return not problems


if __name__ == '__main__':
    themes = sys.argv[1:] or ['.']
    ok = all(check(t) for t in themes)
    sys.exit(0 if ok else 1)
