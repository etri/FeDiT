import argparse
import io
import json
import os
from pathlib import Path
import shutil
import urllib.request
from zipfile import ZipFile

from runtime_paths import PACKAGE_ROOT, resolve_data_root

parser=argparse.ArgumentParser()
parser.add_argument('--workspace',type=Path,default=PACKAGE_ROOT/'workspace')
parser.add_argument('--data-root',type=Path,default=None,help='directory that receives MOT20/ (default: data/)')
parser.add_argument('--gt-only',action='store_true',help='fetch only gt.txt and seqinfo.ini of the four sequences (a few MB via HTTP range requests); enough to evaluate tracking results')
args=parser.parse_args()
work=args.workspace.expanduser().resolve()
data_root=resolve_data_root(work,args.data_root)
lengths={'MOT20-01':429,'MOT20-02':2782,'MOT20-03':2405,'MOT20-05':3315}
target=data_root/'MOT20'
url=os.environ.get('SNR010_MOT20_URL','https://motchallenge.net/data/MOT20.zip')


class RemoteFile(io.RawIOBase):
    """Read-only seekable view of a remote file, fetched with HTTP range requests in 1 MiB blocks."""
    BLOCK=1024*1024

    def __init__(self,address):
        self.address=address
        self.position=0
        self.blocks={}
        request=urllib.request.Request(address,headers={'Range':'bytes=0-0'})
        with urllib.request.urlopen(request,timeout=120) as response:
            if response.status!=206:
                raise OSError('The server does not support HTTP range requests')
            self.size=int(response.headers['Content-Range'].rsplit('/',1)[-1])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self,offset,whence=io.SEEK_SET):
        self.position={io.SEEK_SET:offset,io.SEEK_CUR:self.position+offset,io.SEEK_END:self.size+offset}[whence]
        return self.position

    def block(self,index):
        if index not in self.blocks:
            start=index*self.BLOCK
            end=min(start+self.BLOCK,self.size)-1
            request=urllib.request.Request(self.address,headers={'Range':f'bytes={start}-{end}'})
            with urllib.request.urlopen(request,timeout=120) as response:
                data=response.read()
            if len(data)!=end-start+1:
                raise OSError('Short range response')
            if len(self.blocks)>=64:
                self.blocks.pop(next(iter(self.blocks)))
            self.blocks[index]=data
        return self.blocks[index]

    def readinto(self,buffer):
        wanted=min(len(buffer),self.size-self.position)
        written=0
        while written<wanted:
            index,offset=divmod(self.position,self.BLOCK)
            chunk=self.block(index)[offset:offset+wanted-written]
            buffer[written:written+len(chunk)]=chunk
            written+=len(chunk)
            self.position+=len(chunk)
        return written


def wanted(relative):
    parts=relative.parts
    if len(parts)<4 or parts[0]!='MOT20' or parts[1]!='train' or parts[2] not in lengths:
        return False
    return not args.gt_only or relative.as_posix().endswith(('/gt/gt.txt','/seqinfo.ini'))


if args.gt_only:
    if all((target/'train'/sequence/'gt/gt.txt').is_file() and (target/'train'/sequence/'seqinfo.ini').is_file() for sequence in lengths):
        print('GROUND_TRUTH_CACHE_VERIFIED',json.dumps(lengths),flush=True)
        raise SystemExit(0)
    try:
        remote=RemoteFile(url)
    except OSError as error:
        print('RANGE_REQUESTS_UNAVAILABLE',error,'- falling back to the full archive download',flush=True)
    else:
        count=0
        with ZipFile(remote) as source:
            for item in source.infolist():
                relative=Path(item.filename)
                if relative.is_absolute() or '..' in relative.parts:
                    raise ValueError('Unsafe archive path')
                if item.is_dir() or not wanted(relative):
                    continue
                destination=data_root/relative
                destination.parent.mkdir(parents=True,exist_ok=True)
                with source.open(item) as stream,destination.open('wb') as output:
                    shutil.copyfileobj(stream,output,1024*1024)
                count+=1
        if count!=2*len(lengths):
            raise RuntimeError('Ground truth files are missing from the archive')
        print('GROUND_TRUTH_READY',json.dumps(lengths),'files',count,'remote_bytes',remote.size,flush=True)
        raise SystemExit(0)
complete=not args.gt_only and all((target/'train'/sequence/'gt/gt.txt').is_file() and (target/'train'/sequence/'seqinfo.ini').is_file() and all((target/'train'/sequence/'img1'/f'{frame:06d}.jpg').is_file() for frame in range(1,length+1)) for sequence,length in lengths.items())
if complete:
    print('DATASET_CACHE_VERIFIED',json.dumps(lengths),flush=True)
    raise SystemExit(0)
archives=work/'downloads'
archives.mkdir(parents=True,exist_ok=True)
archive=archives/'MOT20.zip'
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
        if item.is_dir() or not wanted(relative):
            continue
        destination=data_root/relative
        destination.parent.mkdir(parents=True,exist_ok=True)
        with source.open(item) as stream,destination.open('wb') as output:
            shutil.copyfileobj(stream,output,1024*1024)
        if destination.suffix.lower()=='.jpg':
            extracted_images+=1
            if extracted_images%500==0:
                print('EXTRACTED_IMAGES',extracted_images,'of',sum(lengths.values()),flush=True)
if args.gt_only:
    if any(not (target/'train'/sequence/'gt/gt.txt').is_file() for sequence in lengths):
        raise RuntimeError('Ground truth files are missing from the archive')
    print('GROUND_TRUTH_READY',json.dumps(lengths),flush=True)
    raise SystemExit(0)
for sequence,length in lengths.items():
    if any(not (target/'train'/sequence/'img1'/f'{frame:06d}.jpg').is_file() for frame in range(1,length+1)):
        raise RuntimeError('Incomplete extracted dataset: '+sequence)
print('DATASET_READY',json.dumps(lengths),flush=True)
