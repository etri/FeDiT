import argparse
import json
from pathlib import Path
import shutil
import urllib.request
from zipfile import ZipFile

parser=argparse.ArgumentParser()
parser.add_argument('--workspace',type=Path,default=Path(__file__).resolve().parent/'workspace')
args=parser.parse_args()
work=args.workspace.expanduser().resolve()
lengths={'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}
target=work/'data/MOT20'
complete=all((target/'train'/sequence/'gt/gt.txt').is_file() and (target/'train'/sequence/'seqinfo.ini').is_file() and all((target/'train'/sequence/'img1'/f'{frame:06d}.jpg').is_file() for frame in range(1,length+1)) for sequence,length in lengths.items())
if complete:
    print('DATASET_CACHE_VERIFIED',json.dumps(lengths),flush=True)
    raise SystemExit(0)
archives=work/'downloads'
archives.mkdir(parents=True,exist_ok=True)
archive=archives/'MOT20.zip'
url='https://motchallenge.net/data/MOT20.zip'
if not archive.exists():
    part=archive.with_suffix('.zip.part')
    offset=part.stat().st_size if part.exists() else 0
    request=urllib.request.Request(url,headers={'Range':f'bytes={offset}-'} if offset else {})
    with urllib.request.urlopen(request,timeout=120) as response:
        resume=offset>0 and response.status==206
        mode='ab' if resume else 'wb'
        downloaded=offset if resume else 0
        remaining=int(response.headers.get('Content-Length',0))
        expected=downloaded+remaining if remaining else None
        reported=downloaded
        print('DATASET_DOWNLOAD',url,'offset_bytes',downloaded,'total_bytes',expected,flush=True)
        with part.open(mode) as stream:
            while chunk:=response.read(1024*1024):
                stream.write(chunk)
                downloaded+=len(chunk)
                if downloaded-reported>=256*1024*1024:
                    print('DOWNLOAD_PROGRESS_MIB',round(downloaded/(1024*1024),1),'of',round(expected/(1024*1024),1) if expected else 'unknown',flush=True)
                    reported=downloaded
        if expected is not None and downloaded!=expected:
            raise OSError('Dataset download is incomplete; rerun to resume')
    part.replace(archive)
    print('DATASET_ARCHIVE_DOWNLOADED',downloaded,flush=True)
extracted_images=0
with ZipFile(archive) as source:
    for item in source.infolist():
        relative=Path(item.filename)
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('Unsafe archive path')
        if len(relative.parts)<4 or relative.parts[0]!='MOT20' or relative.parts[1]!='train' or relative.parts[2] not in lengths or item.is_dir():
            continue
        destination=work/'data'/relative
        destination.parent.mkdir(parents=True,exist_ok=True)
        with source.open(item) as stream,destination.open('wb') as output:
            shutil.copyfileobj(stream,output,1024*1024)
        if destination.suffix.lower()=='.jpg':
            extracted_images+=1
            if extracted_images%500==0:
                print('EXTRACTED_IMAGES',extracted_images,'of',sum(lengths.values()),flush=True)
for sequence,length in lengths.items():
    if any(not (target/'train'/sequence/'img1'/f'{frame:06d}.jpg').is_file() for frame in range(1,length+1)):
        raise RuntimeError('Incomplete extracted dataset: '+sequence)
print('DATASET_READY',json.dumps(lengths),flush=True)
