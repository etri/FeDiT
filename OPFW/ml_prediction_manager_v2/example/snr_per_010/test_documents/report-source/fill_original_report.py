from pathlib import Path
from zipfile import ZipFile
import argparse
import json
from lxml import etree

parser=argparse.ArgumentParser()
parser.add_argument('--payload',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
base=Path(__file__).resolve().parent
payload=json.loads(Path(args.payload).read_text(encoding='utf-8'))
ns={'hp':'http://www.hancom.co.kr/hwpml/2011/paragraph'}
with ZipFile(base/'reference-original-layout.hwpx') as source:
    contents={info.filename:source.read(info.filename) for info in source.infolist()}
    infos=source.infolist()

for section,changes in payload['paragraphs'].items():
    name=f'Contents/section{section}.xml'
    document=etree.fromstring(contents[name])
    paragraphs=document.findall('.//hp:p',ns)
    for index,value in changes.items():
        paragraph=paragraphs[int(index)]
        texts=paragraph.findall('hp:run/hp:t',ns)
        if not texts:
            runs=paragraph.findall('hp:run',ns)
            if not runs:
                raise RuntimeError(f'No original text run at section{section}:{index}')
            texts=[etree.SubElement(runs[0],f"{{{ns['hp']}}}t")]
        for item in texts:
            if len(item):
                raise RuntimeError(f'Control inside text at section{section}:{index}')
        texts[0].text=value
        for item in texts[1:]:
            item.text=''
    contents[name]=etree.tostring(document,encoding='UTF-8',xml_declaration=True,standalone=True)

for section,changes in payload.get('toc',{}).items():
    name=f'Contents/section{section}.xml'
    document=etree.fromstring(contents[name])
    paragraphs=document.findall('.//hp:p',ns)
    for index,value in changes.items():
        paragraph=paragraphs[int(index)]
        texts=paragraph.findall('hp:run/hp:t',ns)
        label=value['label']
        placed=False
        for item in texts:
            if item.text:
                item.text=label if not placed else ''
                placed=True
            for child in item:
                if child.tag==f"{{{ns['hp']}}}tab":
                    child.tail=str(value['page'])
        if not placed:
            raise RuntimeError('Missing TOC label')
    contents[name]=etree.tostring(document,encoding='UTF-8',xml_declaration=True,standalone=True)

for name,path in payload.get('pictures',{}).items():
    if name not in contents:
        raise RuntimeError(f'Unknown original picture {name}')
    contents[name]=Path(path).read_bytes()

for name in [key for key in contents if key.startswith('Contents/section') and key.endswith('.xml')]:
    document=etree.fromstring(contents[name])
    for cache in document.findall('.//hp:linesegarray',ns):
        cache.getparent().remove(cache)
    contents[name]=etree.tostring(document,encoding='UTF-8',xml_declaration=True,standalone=True)

destination=Path(args.output)
destination.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(destination,'w') as target:
    for info in infos:
        target.writestr(info,contents[info.filename])
with ZipFile(destination) as target:
    with ZipFile(base/'reference-original-layout.hwpx') as original:
        for name in ['Contents/header.xml','BinData/image1.bmp','BinData/image2.bmp']:
            assert target.read(name)==original.read(name)
print(destination)
