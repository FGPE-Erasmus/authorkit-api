#!/bin/sh
# wait until MySQL is really available

set -e

host="$1"
shift
port="$1"
shift
shift
cmd="$@"

echo $host
echo $port
echo $MYSQL_USERNAME
echo $MYSQL_PASSWORD

while ! mysql --protocol TCP -h "$host" -P $port -u"root" -p"gkwCmTcr0,Yf~oe65pEh^EJ" -e "show databases;" > /dev/null 2>&1; do
    sleep 1
done

>&2 echo "MySQL is up - executing command"
exec $cmd
