import matplotlib.pyplot as plt

results = list(map(lambda e: int(e.strip()), open(
    '../results.txt', 'r').readlines()))

smootherRes = []

SAMPLES = 50

for i in range(SAMPLES, len(results) - SAMPLES, SAMPLES):
    newPoint = results[i-SAMPLES:i+SAMPLES]
    smootherRes.append(sum(newPoint) // len(newPoint))

fig, ax = plt.subplots()
ax.plot([x * SAMPLES for x in range(len(smootherRes))], smootherRes)
print("Best result:", max(results))

plt.show()
