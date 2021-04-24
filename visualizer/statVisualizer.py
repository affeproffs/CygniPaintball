import matplotlib.pyplot as plt

results = list(map(lambda e: int(e.strip()), open(
    '../results.txt', 'r').readlines()))

smootherRes = []

for i in range(4, len(results) - 4):
    newPoint = results[i-4:i+4]
    smootherRes.append(sum(newPoint) // len(newPoint))

fig, ax = plt.subplots()
ax.plot(smootherRes)

plt.show()
