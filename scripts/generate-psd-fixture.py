"""Build a synthetic import PSD from bundled CC-BY artwork; requires Python + Pillow and Node.
This is an application test fixture, not an official Blender production PSD.
Run: python scripts/generate-psd-fixture.py
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image, ImageDraw, ImageFont
import json, shutil, subprocess
ROOT = Path(__file__).resolve().parents[1]
W,H=900,1200

def font(size):
    for candidate in ('Arial.ttf','DejaVuSans.ttf','C:/Windows/Fonts/arial.ttf'):
        try:return ImageFont.truetype(candidate,size)
        except OSError:pass
    return ImageFont.load_default(size=size)

with TemporaryDirectory(prefix='ipbible-psd-') as tmp:
    work=Path(tmp)
    layers=[]
    composite=Image.new('RGBA',(W,H),(243,239,229,255))
    def layer(name, image, x=0, y=0, hidden=False, text=None, group=None):
        file=f'{len(layers)}.rgba'
        (work/file).write_bytes(image.tobytes())
        record=dict(name=name,file=file,width=image.width,height=image.height,left=x,top=y,hidden=hidden)
        if text:record['text']=text
        if group:record['group']=group
        layers.append(record)
        if not hidden:composite.alpha_composite(image,(x,y))
    layer('Paper background',Image.new('RGBA',(W,H),(243,239,229,255)))
    title=Image.new('RGBA',(780,70),(0,0,0,0))
    ImageDraw.Draw(title).text((0,5),'IP BIBLE / IMPORT TEST',fill=(35,45,44),font=font(34))
    layer('Editable title',title,60,45,text=dict(text='IP BIBLE / IMPORT TEST',transform=[1,0,0,1,60,50],style=dict(font=dict(name='ArialMT'),fontSize=34,fillColor=dict(r=35,g=45,b=44))))
    for file,name,y in [('spring/spring.webp','Spring character sheet',160),('sintel/sintel.webp','Sintel character concept',610)]:
        image=Image.open(ROOT/'public/examples'/file).convert('RGBA')
        image.thumbnail((640,400),Image.Resampling.LANCZOS)
        layer(name,image,130,y,group='Characters')
    hidden=Image.open(ROOT/'public/examples/spring/autumn.webp').convert('RGBA')
    hidden.thumbnail((400,250),Image.Resampling.LANCZOS)
    layer('Autumn alternate - hidden',hidden,250,500,hidden=True,group='Hidden alternatives')
    credit=Image.new('RGBA',(820,110),(0,0,0,0))
    lines='SYNTHETIC TEST PSD - NOT AN OFFICIAL SOURCE FILE\nSpring: Blender Foundation / CC BY 4.0\nSintel: Blender Foundation; David Revoy / CC BY 3.0'
    ImageDraw.Draw(credit).multiline_text((0,0),lines,fill=(35,45,44),font=font(16),spacing=8)
    layer('Attribution and fixture notice',credit,40,1060,text=dict(text=lines,transform=[1,0,0,1,40,1060],style=dict(font=dict(name='ArialMT'),fontSize=16,fillColor=dict(r=35,g=45,b=44))))
    (work/'composite.rgba').write_bytes(composite.tobytes())
    (work/'manifest.json').write_text(json.dumps(dict(width=W,height=H,layers=layers)),encoding='utf-8')
    node=shutil.which('node')
    if not node:raise SystemExit('Node.js is required (use npm install first).')
    subprocess.run([node,str(ROOT/'scripts/write-psd-fixture.mjs'),str(work),str(ROOT/'tests/fixtures/layered-sample.psd')],check=True)
