"""Bringt Code von staging nach main, ohne die Inhalte aus dem Shop zu ueberschreiben.

Der Theme-Editor des Shops schreibt seine Aenderungen direkt nach main. Dieses
Skript holt diesen Stand zuerst ab, fuehrt ihn in staging zusammen, prueft das
Theme und schreibt erst danach nach main. Bei einem Konflikt in einer
Inhaltsdatei bricht es ab, statt eine Seite zu bevorzugen.

  python3 deploy.py           zeigt nur, was passieren wuerde
  python3 deploy.py --push    fuehrt den Ablauf aus
"""
import os
import subprocess
import sys

# Dateien, die der Theme-Editor schreibt. Alles hier drin gehoert dem Shop.
CONTENT_PREFIXES = ('templates/', 'locales/')
CONTENT_FILES = ('config/settings_data.json',)
CONTENT_SUFFIXES = ('-group.json',)

CODE_BRANCH = 'staging'
SHOP_BRANCH = 'main'


def git(*args, check=True):
    r = subprocess.run(('git',) + args, capture_output=True, text=True)
    if check and r.returncode:
        sys.exit(f'Abbruch: git {" ".join(args)}\n{r.stderr.strip()}')
    return r


def out(*args):
    return git(*args).stdout.strip()


def is_content(path):
    return (path.startswith(CONTENT_PREFIXES)
            or path in CONTENT_FILES
            or path.endswith(CONTENT_SUFFIXES))


def remotes():
    return [r for r in out('remote').splitlines() if r]


def shop_remote(names):
    """Das Repo, in das Shopify committet. Erkennbar am Autor shopify[bot]."""
    for name in names:
        log = out('log', '-50', '--format=%an', f'{name}/{SHOP_BRANCH}')
        if 'shopify' in log.lower():
            return name
    return names[0]


def bullet(lines, empty):
    if not lines:
        print(f'  {empty}')
    for line in lines:
        print(f'  {line}')


def main():
    push = '--push' in sys.argv[1:]

    root = out('rev-parse', '--show-toplevel')
    os.chdir(root)

    if out('status', '--porcelain', '--untracked-files=no'):
        sys.exit('Abbruch: Es liegen noch offene Aenderungen vor. Erst committen.')

    names = remotes()
    if not names:
        sys.exit('Abbruch: Kein Remote eingerichtet.')

    print('Hole den aktuellen Stand ...')
    git('fetch', '--all', '--quiet')

    shop = shop_remote(names)
    shop_ref = f'{shop}/{SHOP_BRANCH}'
    print(f'Shop-Repo: {shop} ({shop_ref})\n')

    new = out('log', '--format=%h %an: %s', f'{CODE_BRANCH}..{shop_ref}').splitlines()
    print(f'Neu im Shop, noch nicht in {CODE_BRANCH}:')
    bullet(new, 'nichts')

    touched = out('diff', '--name-only', f'{CODE_BRANCH}...{shop_ref}').splitlines()
    print('\nDavon Inhaltsdateien des Kunden:')
    bullet([f for f in touched if is_content(f)], 'keine')

    ours = out('diff', '--name-only', f'{shop_ref}...{CODE_BRANCH}').splitlines()
    risky = [f for f in ours if is_content(f)]
    print(f'\nInhaltsdateien, die {CODE_BRANCH} veraendern wuerde:')
    bullet(risky, 'keine, reine Codeaenderung')
    if risky:
        print('\n  Achtung: Diese Dateien pflegt der Kunde im Editor. Vor dem Push')
        print('  im Admin das Live-Theme duplizieren, dann ist der alte Stand sicher.')

    if not push:
        print(f'\nVorschau beendet. Zum Ausfuehren: python3 {sys.argv[0]} --push')
        return

    print(f'\nFuehre {shop_ref} in {CODE_BRANCH} zusammen ...')
    git('checkout', CODE_BRANCH)
    merge = git('merge', '--no-edit', shop_ref, check=False)
    if merge.returncode:
        conflicts = out('diff', '--name-only', '--diff-filter=U').splitlines()
        print(merge.stdout.strip())
        print('\nKonflikte in:')
        bullet(conflicts, '')
        if any(is_content(f) for f in conflicts):
            print('\nDarunter Inhaltsdateien. Beide Seiten von Hand zusammenfuehren,')
            print('nichts pauschal verwerfen. Danach erneut starten.')
        print('\nZum Zuruecksetzen: git merge --abort')
        sys.exit(1)

    if os.path.exists('check-theme.py') and subprocess.run(
            (sys.executable, 'check-theme.py', '.')).returncode:
        sys.exit('\nAbbruch: Die Theme-Pruefung meldet Probleme. Nichts gepusht.')

    print(f'\nSchreibe {CODE_BRANCH} nach {SHOP_BRANCH} ...')
    git('checkout', SHOP_BRANCH)
    if git('merge-base', '--is-ancestor', SHOP_BRANCH, CODE_BRANCH, check=False).returncode:
        git('checkout', CODE_BRANCH)
        sys.exit(f'Abbruch: {SHOP_BRANCH} enthaelt lokale Commits, die {CODE_BRANCH} nicht '
                 f'kennt.\nErst "git checkout {CODE_BRANCH} && git merge {SHOP_BRANCH}", '
                 'dann erneut starten.')
    git('merge', '--ff-only', CODE_BRANCH)

    for name in names:
        print(f'Pushe nach {name} ...')
        git('push', name, SHOP_BRANCH)
        git('push', name, CODE_BRANCH)

    git('checkout', CODE_BRANCH)
    print('\nFertig. Shopify uebernimmt die Aenderungen in wenigen Sekunden.')


if __name__ == '__main__':
    main()
