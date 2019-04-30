#!/bin/bash
if [ "$#" -ne 1 ]; then
    echo "Specify the hostname, for example: ./loadgen.sh ae14394d665e511e9924a0a2aaf90b52-1253516278.eu-west-1.elb.amazonaws.com"
    exit
fi

HOST=$1
PORT=8080
  
for i in {1..1000}
do
        curl -d "message=automated_message_$i" -X POST http://$HOST:$PORT/message 
        sleep 1
done
