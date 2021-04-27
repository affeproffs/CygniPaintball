#!/bin/bash
for i in {1..100}
do
	npm run startBoringLocal
	echo "Run: " $i
done
