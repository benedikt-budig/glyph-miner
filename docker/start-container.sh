#!/bin/sh

# start mysqld and set up database
echo "Starting mysql"
/usr/sbin/mysqld &
sleep 10
echo "CREATE DATABASE glyphminer" | mysql --default-character-set=utf8
echo "GRANT USAGE ON *.* TO glyphminer@localhost IDENTIFIED BY 'glyphminer'" | mysql --default-character-set=utf8
echo "GRANT ALL PRIVILEGES ON glyphminer.* TO glyphminer@localhost" | mysql --default-character-set=utf8
mysql --user=glyphminer --password=glyphminer --default-character-set=utf8 glyphminer < /opt/glyph-miner/server/schema.sql

echo "Starting nginx"
# start nginx
nginx &

echo "Starting the python backend"
# start the python server backend
/usr/local/bin/uwsgi --socket 127.0.0.1:9090 --chdir /opt/glyph-miner/server/ --wsgi-file /opt/glyph-miner/server/server.py --master --processes 4 --threads 2 


