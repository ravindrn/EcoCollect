
import numpy as np
from monthly.methods import METHODS

history = np.array([
    33, 32.5, 32, 41.5,
    37, 41.5, 62, 66,
    70, 55.5, 50, 58,
    53.5, 41, 46.5, 44.5
])

for name, function in METHODS.items():
    try:
        prediction = function(history)
        print(f"{name}: {prediction:.2f} loads")
    except Exception as error:
        print(f"{name} failed: {error}")
