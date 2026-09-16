import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

QUERIES = [
    '"embraced Islam" Igbo Nigeria',
    '"converted to Islam" Igbo Nigeria',
    '"embraced Islam" Enugu Nigeria',
    '"converted to Islam" Enugu Nigeria',
    '"embraced Islam" Anambra Nigeria',
    '"converted to Islam" Anambra Nigeria',
    '"embraced Islam" Imo Nigeria',
    '"converted to Islam" Imo Nigeria',
    '"embraced Islam" Abia Nigeria',
    '"converted to Islam" Abia Nigeria',
    '"embraced Islam" Ebonyi Nigeria',
    '"converted to Islam" Ebonyi Nigeria'
]

OUT = Path(__file__).resolve().parents[1] / 'data' / 'candidates.json'

def fetch_rss(query):
    q = urllib.parse.quote(query)
    url = f'https://news.google.com/rss/search?q={q}&hl=en-NG&gl=NG&ceid=NG:en'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 IgbolandConversionMonitor/1.0'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()

def parse_items(blob, query):
    root = ET.fromstring(blob)
    rows = []
    for item in root.findall('.//item')[:20]:
        title = (item.findtext('title') or '').strip()
        link = (item.findtext('link') or '').strip()
        pub = (item.findtext('pubDate') or '').strip()
        source_el = item.find('source')
        source = (source_el.text or '').strip() if source_el is not None else ''
        low = title.lower()
        if not any(k in low for k in ['islam', 'muslim']):
            continue
        rows.append({
            'title': title,
            'url': link,
            'published': pub,
            'source': source,
            'matched_query': query,
            'status': 'awaiting-human-verification'
        })
    return rows

def main():
    existing = {'last_scan': None, 'candidate_count': 0, 'candidates': []}
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text(encoding='utf-8'))
        except Exception:
            pass

    by_key = {}
    for row in existing.get('candidates', []):
        key = (row.get('url') or row.get('title') or '').strip().lower()
        if key:
            by_key[key] = row

    for query in QUERIES:
        try:
            for row in parse_items(fetch_rss(query), query):
                key = (row.get('url') or row.get('title') or '').strip().lower()
                if key and key not in by_key:
                    by_key[key] = row
        except Exception as e:
            print(f'Query failed: {query}: {e}')

    candidates = list(by_key.values())[-150:]
    payload = {
        'last_scan': datetime.now(timezone.utc).isoformat(),
        'candidate_count': len(candidates),
        'candidates': candidates
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {len(candidates)} candidates to {OUT}')

if __name__ == '__main__':
    main()
