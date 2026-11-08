"""Extract only published aggregate rows; never PRAMS respondent-level records.
Usage: python scripts/extract_prams.py /path/to/PRAMS-MCH-Indicators-2022-508.xlsx
Then run python scripts/build_open_data.py. Standard library only.
"""
import csv, hashlib, sys, zipfile, xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
workbook=Path(sys.argv[1]); expected=(ROOT/'data/sources/prams-2022-workbook.sha256').read_text().strip()
assert hashlib.sha256(workbook.read_bytes()).hexdigest()==expected, 'Workbook changed; review source rows and definitions before updating the pinned extract.'
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(workbook) as z:
    strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
    records=[]
    for sheet,row,indicator in [('sheet5',74,'Self-reported postpartum depressive symptoms'),('sheet6',109,'Had maternal postpartum checkup'),('sheet12',74,'No insurance postpartum')]:
        cells={}
        for r in E.fromstring(z.read('xl/worksheets/'+sheet+'.xml')).findall('.//s:row',ns):
            if int(r.get('r'))!=row:continue
            for c in r.findall('s:c',ns):
                v=c.find('s:v',ns);val=v.text if v is not None else ''
                cells[''.join(x for x in c.get('r') if x.isalpha())]=strings[int(val)] if c.get('t')=='s' else val
        assert cells['A']=='Sites aggregated*', 'Unexpected population row'
        records.append(dict(indicator=indicator,year=2022,sheet=sheet,row=row,population=cells['A'],unweightedDenominator=cells['B'],unweightedNumerator=cells['C'],weightedPercent=cells['D'],lower95=cells['E'],upper95=cells['F']))
with (ROOT/'data/sources/prams-2022-reference.csv').open('w',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=records[0]);writer.writeheader();writer.writerows(records)
print('Verified workbook checksum; extracted 3 published aggregate rows.')
