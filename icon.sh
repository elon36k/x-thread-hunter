cd images;

for i in `echo '16 32 48 128'`;
do 
    convert icon.png -resize "${i}x${i}" icon$i.png ;
    echo icon$i.png
done
