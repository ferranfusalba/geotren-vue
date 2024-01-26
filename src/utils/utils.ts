const degreesToRadians = (degrees: number) => {
  const radians = (degrees * Math.PI) / 180
  return radians
}

export const calcDistance = (
  startingCoords: { latitude: number; longitude: number },
  destinationCoords: { latitude: number; longitude: number }
) => {
  const startingLat = degreesToRadians(startingCoords.latitude)
  const startingLong = degreesToRadians(startingCoords.longitude)
  const destinationLat = degreesToRadians(destinationCoords.latitude)
  const destinationLong = degreesToRadians(destinationCoords.longitude)

  // Radius of the Earth in kilometers
  const radius = 6571

  // Haversine equation
  const distanceInKilometers =
    Math.acos(
      Math.sin(startingLat) * Math.sin(destinationLat) +
        Math.cos(startingLat) * Math.cos(destinationLat) * Math.cos(startingLong - destinationLong)
    ) * radius

  return distanceInKilometers
}
