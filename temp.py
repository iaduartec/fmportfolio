import zlib, os
sha='"efc4264a34950365a4a523ea8aeda769f95c1ad9"'
path=os.path.join('.git','objects',sha[:2],sha[2:])
with open(path,'rb') as f:
    data=zlib.decompress(f.read())
print(data.decode(errors='replace'))
