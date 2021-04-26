fileName = input("What's the name of the file? ../logs/")

results = list(map(lambda e: e.split(" "), open(
    '../logs/' + fileName, 'r').readlines()))

"""
Interesting statistics:
    - Average score of all runs
    - Worst score
    - Best score
    - Average of worst 20% of scores
    - Average of best 20% of scores
    - Win %
"""
results = sorted(results, key=lambda r: int(r[0]))
scores = [int(r[0]) for r in results]
wins = [int(r[2].strip()) for r in results]

print("Average score:", sum(scores) / len(scores))
print("Best score:", scores[-1])
print("Worst score:", scores[0])
worstTwenty = scores[:(len(scores) // 5)]
print("Average of bottom 20%:", sum(worstTwenty) / len(worstTwenty))
bestTwenty = scores[int(len(scores) * 0.8):]
print("Average of top 20%:", sum(bestTwenty) / len(bestTwenty))
winrate = sum(wins) / len(wins)
print("Winrate: ", winrate * 100, "%", sep="")
