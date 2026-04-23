export async function getNextRace() {

  const response = await fetch(
    "https://api.jolpi.ca/ergast/f1/current/next.json"
  );

  const data = await response.json();

  return data.MRData.RaceTable.Races[0];

}