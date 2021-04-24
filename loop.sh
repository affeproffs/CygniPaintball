#!/bin/bash
for i in {1..100000}
do
	npm start
	echo "Run: " $i
done
